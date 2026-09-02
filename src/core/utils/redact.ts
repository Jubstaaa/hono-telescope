import { REDACTED } from '../constants.js';

export function redactHeaders(
  headers: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  if (keys.length === 0) return { ...headers };

  const lowered = new Set(keys.map((key) => key.toLowerCase()));
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(headers)) {
    const finalValue = lowered.has(key.toLowerCase()) ? REDACTED : value;
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      value: finalValue,
      writable: true,
    });
  }

  return result;
}

export function redactBody(value: unknown, keys: string[]): unknown {
  const lowered = new Set(keys.map((key) => key.toLowerCase()));

  const walk = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(walk);

    if (input !== null && typeof input === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(input as Record<string, unknown>)) {
        const finalValue = lowered.has(key.toLowerCase()) ? REDACTED : walk(nested);
        Object.defineProperty(result, key, {
          configurable: true,
          enumerable: true,
          value: finalValue,
          writable: true,
        });
      }
      return result;
    }

    return input;
  };

  return walk(value);
}
