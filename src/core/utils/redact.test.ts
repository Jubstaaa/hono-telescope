import { describe, expect, it } from 'vitest';
import { redactBody, redactHeaders } from './redact';

describe('redactHeaders', () => {
  it('redacts case-insensitively and leaves others alone', () => {
    const result = redactHeaders({ Authorization: 'Bearer x', accept: 'json' }, ['authorization']);

    expect(result).toEqual({ Authorization: '[REDACTED]', accept: 'json' });
  });

  it('does not mutate the input', () => {
    const headers = { authorization: 'Bearer x' };
    redactHeaders(headers, ['authorization']);

    expect(headers.authorization).toBe('Bearer x');
  });
});

describe('redactBody', () => {
  it('redacts matching keys at any depth', () => {
    const result = redactBody({ user: { password: 'p', name: 'n' } }, ['password']);

    expect(result).toEqual({ user: { password: '[REDACTED]', name: 'n' } });
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
});
