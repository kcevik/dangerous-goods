/**
 * Query normalisation for the Stoffsuche.
 *
 * Two forms of the same text:
 * - `foldText` — for comparing in JS (ranking, synonyms): lower case, ä→ae ö→oe ü→ue ß→ss,
 *   accents dropped, every separator one space. "Schwefelsäure" and "SCHWEFELSAEURE" fold alike.
 * - `namePatterns` — ILIKE patterns for PostgREST. The BAM names keep their umlauts and never
 *   contain ß, so a typed "ae" is tried both as "ae" and "ä", and "ß" becomes "ss".
 */

/** the ICAO table's placeholder for entries without a UN number (mostly "forbidden" articles) */
export const PLACEHOLDER_UN = '9999'

const UMLAUTS: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }

export function foldText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, c => UMLAUTS[c]!)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** "UN3373", "UN 3373", "un-3373" and "3373" → "3373"; anything else → null */
export function parseUnNumber(query: string): string | null {
  const m = /^\s*(?:un[\s-]*)?(\d{4})\s*$/i.exec(query)
  return m ? m[1]! : null
}

/** a partial UN number ("33", "UN 33") → its digits, for a prefix search; anything else → null */
export function unPrefix(query: string): string | null {
  const m = /^\s*(?:un[\s-]*)?(\d{1,4})\s*$/i.exec(query)
  return m ? m[1]! : null
}

/** separators and every character that would change a PostgREST filter or a LIKE pattern */
const SPLIT_RE = /[\s\-–—_,;/()"'%*\\:]+/

/**
 * Light plural tolerance, only ever shortening a word (so the ILIKE stays a superset):
 * "batterien"/"farben" → drop "n", "akkus" → drop "s", "battery" → drop "y".
 */
export function stemToken(token: string): string {
  if (token.length < 5) return token
  if (token.endsWith('en')) return token.slice(0, -1)
  if (token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  if (token.endsWith('y')) return token.slice(0, -1)
  return token
}

/** lower-cased, stemmed words of the query, umlauts kept (ß → ss) */
export function searchTokens(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .split(SPLIT_RE)
    .filter(Boolean)
    .map(stemToken)
}

/** the characters left once separators are gone — the "is it long enough" measure */
export function searchableLength(query: string): number {
  return searchTokens(query).join('').length
}

const MAX_UMLAUT_SITES = 4

/** "ae"/"oe"/"ue" → each site both as typed and as ä/ö/ü; more than 4 sites: all or none */
function umlautVariants(text: string): string[] {
  const sites: number[] = []
  const re = /ae|oe|ue/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) sites.push(m.index)
  if (sites.length === 0) return [text]

  const toUmlaut = (s: string) => ({ ae: 'ä', oe: 'ö', ue: 'ü' })[s]!
  const apply = (mask: number) => {
    let out = ''
    let last = 0
    sites.forEach((at, i) => {
      out += text.slice(last, at)
      const pair = text.slice(at, at + 2)
      out += mask & (1 << i) ? toUmlaut(pair) : pair
      last = at + 2
    })
    return out + text.slice(last)
  }

  if (sites.length > MAX_UMLAUT_SITES) return [text, apply((1 << sites.length) - 1)]
  return Array.from({ length: 1 << sites.length }, (_, mask) => apply(mask))
}

/**
 * ILIKE patterns for the name columns: words joined by "%" so "Lithium Ionen" finds
 * "LITHIUM-IONEN-BATTERIEN", plus the umlaut spellings. Empty when nothing searchable is left.
 */
export function namePatterns(query: string): string[] {
  const tokens = searchTokens(query)
  if (tokens.length === 0) return []
  return [...new Set(umlautVariants(tokens.join('%')))].map(p => `%${p}%`)
}

/** the folded, stemmed query — what synonyms and ranking compare against */
export function foldedStem(query: string): string {
  return foldText(query).split(' ').filter(Boolean).map(stemToken).join(' ')
}
