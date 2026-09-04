/**
 * Only allow same-origin absolute paths as post-login redirect targets.
 * Anything else (protocol-relative, absolute URL, relative path, empty) falls back.
 */
export function safeNext(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}
