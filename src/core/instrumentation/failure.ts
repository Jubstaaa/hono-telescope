export function failureFields(failure: unknown): { failed?: boolean; error?: string } {
  if (failure === undefined) return {};

  const message = failure instanceof Error ? failure.message : String(failure);

  return { failed: true, error: message.length > 0 ? message : 'unknown error' };
}
