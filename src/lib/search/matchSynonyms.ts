import { foldedStem, foldText } from './normalize'
import { type Synonym, SYNONYMS } from './synonyms'

/** prefix matches ("Natronl" → "Natronlauge") only from this many characters on */
const MIN_PREFIX_LENGTH = 5

/**
 * The synonyms a query hits: the same term (case, umlauts, separators and plurals ignored), or a
 * term the query contains as whole words ("Spraydosen leer" → "Spraydose"). Only when neither
 * hits, a term the query is the start of ("Natronl" → "Natronlauge"), so "Akkus" does not drag
 * in "Akkusäure". Keeps the list order.
 */
export function matchSynonyms(query: string, list: readonly Synonym[] = SYNONYMS): Synonym[] {
  const q = foldText(query)
  if (!q) return []
  const qs = foldedStem(query)
  const folded = list.map(s => ({ s, t: foldText(s.term), ts: foldedStem(s.term) }))

  const whole = folded.filter(({ t, ts }) =>
    q === t
    || qs === ts
    || (t.length >= 4 && (` ${qs} `.includes(` ${ts} `) || ` ${q} `.includes(` ${t} `))))
  if (whole.length > 0) return whole.map(({ s }) => s)
  if (q.length < MIN_PREFIX_LENGTH) return []
  return folded.filter(({ t }) => t.startsWith(q)).map(({ s }) => s)
}
