import { HttpErrorResponse } from '@angular/common/http';

/** Tukar ralat HTTP kepada mesej yang pengguna boleh faham. */
export function errorMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return 'Something went wrong. Please try again.';
  if (err.status === 0) return 'Cannot reach the server. Check your connection and try again.';

  const body = err.error as { message?: string; errors?: Record<string, string[]> } | null;
  const fieldErrors = body?.errors ? Object.values(body.errors).flat() : [];
  if (fieldErrors.length) return fieldErrors.join(' ');
  if (body?.message) return body.message;

  if (err.status === 404) return 'That item no longer exists.';
  if (err.status >= 500) return 'The server had a problem. Please try again in a moment.';
  return 'Something went wrong. Please try again.';
}
