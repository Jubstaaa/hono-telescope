import { describe, expect, it } from 'vitest';

import { redactBody, redactHeaders } from './redact.js';

describe('redactHeaders', () => {
  it('redacts case-insensitively and leaves others alone', () => {
    const result = redactHeaders({ accept: 'json', Authorization: 'Bearer x' }, ['authorization']);

    expect(result).toEqual({ accept: 'json', Authorization: '[REDACTED]' });
  });

  it('does not mutate the input', () => {
    const headers = { authorization: 'Bearer x' };
    redactHeaders(headers, ['authorization']);

    expect(headers.authorization).toBe('Bearer x');
  });

  it('preserves literal __proto__ header name', () => {
    const headers = JSON.parse('{"__proto__":"value","other":"header"}');
    const result = redactHeaders(headers, ['password']);

    expect(Object.getOwnPropertyNames(result)).toContain('__proto__');
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });
});

describe('redactBody', () => {
  it('redacts matching keys at any depth', () => {
    const result = redactBody({ user: { name: 'n', password: 'p' } }, ['password']);

    expect(result).toEqual({ user: { name: 'n', password: '[REDACTED]' } });
  });

  it('walks arrays', () => {
    const result = redactBody({ users: [{ token: 't' }] }, ['token']);

    expect(result).toEqual({ users: [{ token: '[REDACTED]' }] });
  });

  it('matches keys case-insensitively', () => {
    expect(redactBody({ apiKey: 'k' }, ['apikey'])).toEqual({
      apiKey: '[REDACTED]',
    });
  });

  it('keeps the shape by replacing rather than deleting', () => {
    const result = redactBody({ password: 'p' }, ['password']) as Record<string, unknown>;

    expect(Object.keys(result)).toEqual(['password']);
  });

  it('passes primitives and null through', () => {
    expect(redactBody('plain', ['password'])).toBe('plain');
    expect(redactBody(null, ['password'])).toBeNull();
  });

  it('returns a deep copy with empty key list', () => {
    const input = { user: { name: 'Alice', password: 'secret' } };
    const result = redactBody(input, []);

    expect(result).toEqual(input);
    expect(result).not.toBe(input);
    expect((result as Record<string, unknown>).user).not.toBe(input.user);

    (result as Record<string, unknown>).user = { name: 'Bob' };
    expect(input.user.name).toBe('Alice');
  });

  it('preserves literal __proto__ key', () => {
    const input = JSON.parse('{"__proto__":{"a":1},"b":2}');
    const result = redactBody(input, ['password']);

    expect(Object.keys(result as Record<string, unknown>)).toContain('__proto__');
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });
});
