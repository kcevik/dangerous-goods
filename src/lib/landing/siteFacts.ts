/**
 * Site facts shown on the landing page and repeated in `static/llms.txt` (a test pins both).
 * Measured on the live BAM tables on 2026-11-23:
 * - `unNumbers`: count(distinct un_number) in ADR, RID, IMDG and UN = 2,347 each; ICAO adds only
 *   the non-UN IDs 8000 and 9999, so the union over all tables is 2,349 identifiers.
 * - `entries`: rows in adr/rid/imdg/icao/un_entries (13,498 in the four regulations + 3,232 UN).
 * - `specialProvisions`: rows in `special_provisions`.
 * Update after every yearly import.
 */
export const SITE_FACTS = {
  unNumbers: '2.347',
  entries: '16.730',
  specialProvisions: '1.354',
} as const

/** How the source is named on the page — the BAM publishes the data; it certifies nothing. */
export const DATA_SOURCE_LABEL = 'BAM-Datenbank GEFAHRGUT'

export const SITE_STATS = [
  { value: SITE_FACTS.unNumbers, label: 'UN-Nummern' },
  { value: SITE_FACTS.entries, label: 'Einträge' },
  { value: '4', label: 'Regelwerke: ADR, RID, IMDG, ICAO' },
  { value: SITE_FACTS.specialProvisions, label: 'Sondervorschriften im Volltext' },
] as const
