export function failureFields(failure: unknown): { error?: string; failed?: boolean } {
  if (failure === undefined) return {};

  const message = failure instanceof Error ? failure.message : String(failure);

  return { error: message.length > 0 ? message : 'unknown error', failed: true };
}
