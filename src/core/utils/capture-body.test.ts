import { describe, expect, it } from 'vitest';

import type { CaptureConfig } from '../../types/index.js';

import { captureResponseBody, isCapturableContentType, readCappedText } from './capture-body.js';

const capture: CaptureConfig = { maxBodySize: 20, requestBody: true, responseBody: true };

describe('isCapturableContentType', () => {
  it('accepts json and text', () => {
    expect(isCapturableContentType('application/json; charset=utf-8')).toBe(true);
    expect(isCapturableContentType('application/problem+json')).toBe(true);
    expect(isCapturableContentType('text/plain')).toBe(true);
  });

  it('rejects absent, binary and event-stream types', () => {
    expect(isCapturableContentType(null)).toBe(false);
    expect(isCapturableContentType('application/octet-stream')).toBe(false);
    expect(isCapturableContentType('image/png')).toBe(false);
    expect(isCapturableContentType('text/event-stream')).toBe(false);
  });
});

describe('readCappedText', () => {
  it('reads a short body whole', async () => {
    const response = new Response('hello');

    expect(await readCappedText(response.body, 20)).toEqual({ text: 'hello', truncated: false });
  });

  it('stops at the cap and reports truncation', async () => {
    const response = new Response('x'.repeat(50));
    const result = await readCappedText(response.body, 20);

    expect(result.truncated).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(20);
  });

  it('does not report truncation when body is exactly maxBytes (single chunk)', async () => {
    const text = 'x'.repeat(20);
    const response = new Response(text);

    const result = await readCappedText(response.body, 20);
    expect(result.truncated).toBe(false);
    expect(result.text).toBe(text);
  });

  it('does not report truncation when body is exactly maxBytes (split chunks)', async () => {
    const chunk1 = new Uint8Array(10);
    chunk1.fill(120); // 'x'
    const chunk2 = new Uint8Array(10);
    chunk2.fill(120); // 'x'

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.close();
      },
    });

    const result = await readCappedText(stream, 20);
    expect(result.truncated).toBe(false);
    expect(result.text).toBe('x'.repeat(20));
  });

  it('reports truncation when body exceeds maxBytes by one byte', async () => {
    const text = 'x'.repeat(21);
    const response = new Response(text);

    const result = await readCappedText(response.body, 20);
    expect(result.truncated).toBe(true);
    expect(result.text.length).toBe(20);
    expect(result.text).toBe('x'.repeat(20));
  });
});

describe('captureResponseBody', () => {
  it('parses a JSON body with no content-length', async () => {
    const response = new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });

    expect(await captureResponseBody(response, capture, [])).toEqual({ ok: true });
  });

  it('wraps non-JSON text under a `response` key', async () => {
    const response = new Response('plain text', {
      headers: { 'content-type': 'text/plain' },
    });

    expect(await captureResponseBody(response, capture, [])).toEqual({ response: 'plain text' });
  });

  it('skips an event stream without reading it', async () => {
    const response = new Response('data: 1\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    expect(await captureResponseBody(response, capture, [])).toBeUndefined();
    expect(response.bodyUsed).toBe(false);
  });

  it('reports metadata only when content-length exceeds the cap', async () => {
    const response = new Response('x'.repeat(50), {
      headers: { 'content-length': '50', 'content-type': 'text/plain' },
    });

    expect(await captureResponseBody(response, capture, [])).toEqual({ size: 50, truncated: true });
    expect(response.bodyUsed).toBe(false);
  });

  it('reports metadata only for an oversize body read without a declared content-length, dropping the secret fragment', async () => {
    const secret = 'eyJhbGciOi.SECRET';
    const bodyText = JSON.stringify({ filler: 'x'.repeat(200), token: secret });
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(bodyText));
        controller.close();
      },
    });
    const response = new Response(stream, { headers: { 'content-type': 'application/json' } });
    expect(response.headers.get('content-length')).toBeNull();

    const result = await captureResponseBody(response, { ...capture, maxBodySize: 20 }, ['token']);
    expect(result).toEqual({ size: 20, truncated: true });
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it('returns undefined when response capture is disabled', async () => {
    const response = new Response('hi', { headers: { 'content-type': 'text/plain' } });

    expect(
      await captureResponseBody(response, { ...capture, responseBody: false }, [])
    ).toBeUndefined();
  });

  it('skips a chunked streaming response without reading it', async () => {
    const response = new Response('chunk', {
      headers: { 'content-type': 'text/plain', 'transfer-encoding': 'chunked' },
    });

    expect(await captureResponseBody(response, capture, [])).toBeUndefined();
    expect(response.bodyUsed).toBe(false);
  });

  it('redacts the configured body keys at any depth', async () => {
    const response = new Response(JSON.stringify({ token: 'jwt', user: { password: 'hunter2' } }), {
      headers: { 'content-type': 'application/json' },
    });

    const roomy: CaptureConfig = { ...capture, maxBodySize: 1024 };

    expect(await captureResponseBody(response, roomy, ['token', 'password'])).toEqual({
      token: '[REDACTED]',
      user: { password: '[REDACTED]' },
    });
  });

  it('parses JSON body of exactly maxBodySize bytes', async () => {
    const body = JSON.stringify({ data: 'x'.repeat(9) });
    expect(new TextEncoder().encode(body).byteLength).toBe(capture.maxBodySize);

    const response = new Response(body, {
      headers: { 'content-type': 'application/json' },
    });

    const result = await captureResponseBody(response, capture, []);
    expect(result).toEqual({ data: 'xxxxxxxxx' });
  });
});
