import { resolve } from '$app/paths'

/**
 * What 1.1.3.6.2 leaves in force (and what it lifts) when a load is exempt.
 * Taken from the ADR text (BMIMI consolidated ADR 2025); see the spec for the quote.
 */

export interface AdrRef {
  /** section number for `?section=` — only linked when the book has it as a heading */
  section: string
  /** what is printed, e.g. "8.1.2.1 a)"; defaults to the section */
  label?: string
}

export interface DutyItem {
  text: string
  refs: AdrRef[]
}

export const REMAINING_DUTIES: readonly DutyItem[] = [
  {
    text: 'Beförderungspapier ausstellen und im Fahrerhaus mitführen. Darin für jede Beförderungskategorie die Gesamtmenge und den berechneten Wert angeben.',
    refs: [{ section: '5.4.1' }, { section: '5.4.1.1.1', label: '5.4.1.1.1 f) Bem. 1' }, { section: '8.1.2.1', label: '8.1.2.1 a)' }],
  },
  {
    text: 'Mindestens ein tragbarer Feuerlöscher für die Brandklassen A, B und C mit mindestens 2 kg Pulver: für Fahrzeuge geeignet (EN 3-7), plombiert, Prüfdatum nicht überschritten, leicht erreichbar und witterungsgeschützt angebracht.',
    refs: [{ section: '8.1.4.2', label: '8.1.4.2 bis 8.1.4.5' }],
  },
  {
    text: 'Unterweisung aller Beteiligten nach Kapitel 1.3 – auch der Fahrzeugführer ohne ADR-Schulungsbescheinigung.',
    refs: [{ section: '8.2.3' }, { section: '1.3', label: 'Kapitel 1.3' }],
  },
  {
    text: 'Versandstücke dürfen von der Fahrzeugbesatzung nicht geöffnet werden; keine funkenerzeugenden tragbaren Beleuchtungsgeräte; Rauchverbot bei Ladearbeiten, auch für E-Zigaretten.',
    refs: [{ section: '8.3.3' }, { section: '8.3.4' }, { section: '8.3.5' }],
  },
  {
    text: 'Überwachung der Fahrzeuge sowie die Sondervorschriften S1 (3) und (6), S2 (1), S4, S5, S14 bis S21 und S24 – soweit Tabelle A Spalte 19 sie für deine Güter nennt.',
    refs: [{ section: '8.4', label: 'Kapitel 8.4' }, { section: '8.5', label: 'Kapitel 8.5' }],
  },
  {
    text: 'Zusammenladeverbote und Ladungssicherung gelten weiter, ebenso die Sondervorschriften V 5 und V 8.',
    refs: [{ section: '7.5.2' }, { section: '7.5.7' }, { section: '7.2.4', label: '7.2.4 (V 5, V 8)' }],
  },
  {
    text: 'Verpackung, Kennzeichnung und Bezettelung der Versandstücke bleiben vollständig Pflicht.',
    refs: [{ section: '4.1', label: 'Kapitel 4.1' }, { section: '5.2', label: 'Kapitel 5.2' }],
  },
  {
    text: 'Sicherung nach Kapitel 1.10 bleibt Pflicht für gefährliche Güter mit hohem Gefahrenpotenzial der Klasse 1 und für freigestellte Versandstücke UN 2910/2911 über dem A2-Wert.',
    refs: [{ section: '1.10.3.1' }],
  },
  {
    text: 'Die Sicherheitspflichten aller Beteiligten gelten unverändert.',
    refs: [{ section: '1.4', label: 'Kapitel 1.4' }],
  },
]

export const LIFTED_RULES: readonly DutyItem[] = [
  { text: 'Orangefarbene Tafeln und Großzettel (Placards)', refs: [{ section: '5.3', label: 'Kapitel 5.3' }] },
  { text: 'Schriftliche Weisungen', refs: [{ section: '5.4.3' }] },
  { text: 'ADR-Schulungsbescheinigung des Fahrzeugführers', refs: [{ section: '8.2.1' }] },
  { text: 'Weitere Ausrüstung außer dem Feuerlöscher', refs: [{ section: '8.1.5' }] },
  { text: 'Tunnelbeschränkungen (Teil 8)', refs: [{ section: '8.6', label: 'Kapitel 8.6' }] },
  { text: 'Kapitel 7.2 außer V 5 und V 8 sowie CV 1', refs: [{ section: '7.2', label: 'Kapitel 7.2' }, { section: '7.5.11' }] },
  { text: 'Sicherung, außer in den oben genannten Fällen', refs: [{ section: '1.10', label: 'Kapitel 1.10' }] },
  { text: 'Bau und Zulassung der Fahrzeuge', refs: [{ section: '9.1', label: 'Teil 9' }] },
]

/** always shown, whatever the verdict */
export const CALCULATION_NOTES: readonly DutyItem[] = [
  {
    text: 'Gilt nur für Versandstücke – nicht für Tanks und nicht für lose Schüttung.',
    refs: [{ section: '1.1.3.6.2' }],
  },
  {
    text: 'Nicht eintragen: Güter in begrenzten Mengen (LQ) und in freigestellten Mengen (EQ) sowie andere nach 1.1.3.6.5 freigestellte Güter – sie zählen nicht mit.',
    refs: [{ section: '1.1.3.6.5' }, { section: '3.4', label: 'Kapitel 3.4' }, { section: '3.5', label: 'Kapitel 3.5' }],
  },
  {
    text: 'Leere ungereinigte Verpackungen zählen zur Beförderungskategorie 4 (0 Punkte); hatten sie Stoffe der Kategorie 0 enthalten, bleiben sie Kategorie 0.',
    refs: [{ section: '1.1.3.6.1' }],
  },
  {
    text: 'Gefahrgutbeauftragter: Die zuständige Behörde kann Unternehmen, die nur innerhalb dieser Grenzen tätig sind, ausnehmen – prüfe die nationale Regelung.',
    refs: [{ section: '1.8.3.2', label: '1.8.3.2 b)' }],
  },
]

/** how 1.1.3.6.3 defines the quantity — shown next to the unit picker */
export const QUANTITY_RULES: readonly string[] = [
  'Feste Stoffe, verflüssigte, tiefgekühlt verflüssigte und gelöste Gase: Nettomasse in kg.',
  'Flüssige Stoffe: Gesamtmenge in Litern.',
  'Verdichtete und adsorbierte Gase, Chemikalien unter Druck: mit Wasser ausgeliterter Fassungsraum des Gefäßes in Litern.',
  'Gegenstände (auch Druckgaspackungen und Batterien): Masse ohne Verpackung in kg; Klasse 1: Nettomasse des explosiven Stoffes; Güter in Geräten: die enthaltene Menge in kg bzw. Litern.',
]

/** the rule itself; the table 1.1.3.6.3 is a heading in the book */
export const RULE_REF: AdrRef = { section: '1.1.3.6.3', label: '1.1.3.6' }

export const DISCLAIMER = 'Hilfsmittel – keine Rechtsberatung, maßgeblich ist der ADR-Text.'

export const DATA_SOURCE
  = 'Stoffdaten: BAM GEFAHRGUT (ADR 2025), Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0). Berechnung und Darstellung durch gefahrgut.org; kein rechtsverbindlicher Text.'

/** every section the page references, for the heading check in the page load */
export const REFERENCED_SECTIONS: readonly string[] = [
  ...new Set([...REMAINING_DUTIES, ...LIFTED_RULES, ...CALCULATION_NOTES].flatMap(d => d.refs.map(r => r.section)).concat(RULE_REF.section)),
]

/** the ADR viewer at `section`, or null when the book has no heading for it */
export function adrSectionHref(section: string, linkable: ReadonlySet<string>): string | null {
  if (!linkable.has(section)) return null
  return `${resolve('/(app)/regelwerk/[mode=bookMode]', { mode: 'adr' })}?section=${encodeURIComponent(section)}`
}
