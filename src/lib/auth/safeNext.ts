const PROBE_ORIGIN = 'https://same-origin.invalid'

// Control characters, backslashes and their percent-encoded forms. Browsers strip
// tab/CR/LF from URLs and treat "\" like "/", so "/\t/evil.example" would pass a
// prefix check and still resolve to https://evil.example (code review 2026-09-29).
const UNSAFE = /[\u0000-\u001F\u007F\\]|%(?:[01][0-9a-f]|7f|5c)/i

/**
 * Only allow same-origin absolute paths as post-login redirect targets.
 * Anything else (protocol-relative, absolute URL, relative path, empty, or a value
 * a browser could resolve off-site) falls back.
 */
export function safeNext(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  if (UNSAFE.test(value)) return fallback

  // the URL parser has the final word: the target must stay on our origin
  let url: URL
  try {
    url = new URL(value, PROBE_ORIGIN)
  }
  catch {
    return fallback
  }
  if (url.origin !== PROBE_ORIGIN) return fallback
  return `${url.pathname}${url.search}${url.hash}`
}
