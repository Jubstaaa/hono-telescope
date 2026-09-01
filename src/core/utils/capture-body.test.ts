import { describe, expect, it } from 'vitest';
import { captureResponseBody, isCapturableContentType, readCappedText } from './capture-body';
import type { CaptureConfig } from '@/types';

const capture: CaptureConfig = { requestBody: true, responseBody: true, maxBodySize: 20 };

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

    expect(await captureResponseBody(response, capture)).toEqual({ ok: true });
  });

  it('wraps non-JSON text under a `response` key', async () => {
    const response = new Response('plain text', {
      headers: { 'content-type': 'text/plain' },
    });

    expect(await captureResponseBody(response, capture)).toEqual({ response: 'plain text' });
  });

  it('skips an event stream without reading it', async () => {
    const response = new Response('data: 1\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    expect(await captureResponseBody(response, capture)).toBeUndefined();
    expect(response.bodyUsed).toBe(false);
  });

  it('reports metadata only when content-length exceeds the cap', async () => {
    const response = new Response('x'.repeat(50), {
      headers: { 'content-type': 'text/plain', 'content-length': '50' },
    });

    expect(await captureResponseBody(response, capture)).toEqual({ truncated: true, size: 50 });
    expect(response.bodyUsed).toBe(false);
  });

  it('returns undefined when response capture is disabled', async () => {
    const response = new Response('hi', { headers: { 'content-type': 'text/plain' } });

    expect(
      await captureResponseBody(response, { ...capture, responseBody: false })
    ).toBeUndefined();
  });

  it('parses JSON body of exactly maxBodySize bytes', async () => {
    const jsonBody = JSON.stringify({ data: 'x'.repeat(6) }); // 20 bytes exactly
    const response = new Response(jsonBody, {
      headers: { 'content-type': 'application/json' },
    });

    const result = await captureResponseBody(response, capture);
    expect(result).toEqual({ data: 'xxxxxx' });
  });
});
