import { REDACTED } from '../constants';

export function redactHeaders(
  headers: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  if (keys.length === 0) return { ...headers };

  const lowered = new Set(keys.map((key) => key.toLowerCase()));
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(headers)) {
    result[key] = lowered.has(key.toLowerCase()) ? REDACTED : value;
  }

  return result;
}

export function redactBody(value: unknown, keys: string[]): unknown {
  if (keys.length === 0) return value;

  const lowered = new Set(keys.map((key) => key.toLowerCase()));

  const walk = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(walk);

    if (input !== null && typeof input === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(input as Record<string, unknown>)) {
        result[key] = lowered.has(key.toLowerCase()) ? REDACTED : walk(nested);
      }
      return result;
    }

    return input;
  };

  return walk(value);
}
