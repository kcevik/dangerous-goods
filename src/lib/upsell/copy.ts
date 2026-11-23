import { resolve } from '$app/paths'

/** the Abo card on /konto carries `id="abo"`; the modal and the banner link straight to it */
export const ABO_ANCHOR = 'abo'

export function upsellHref(): string {
  return `${resolve('/(app)/konto')}#${ABO_ANCHOR}`
}

/** the modal never opens for active accounts and never on /konto itself */
export function upsellEligible(isActive: boolean, pathname: string): boolean {
  if (isActive) return false
  const konto = resolve('/(app)/konto')
  return pathname !== konto && !pathname.startsWith(`${konto}/`)
}

export const UPSELL_TITLE = 'Schalte alle Daten frei'

export const UPSELL_INTRO
  = 'Dein Konto ist noch nicht freigeschaltet. Bis dahin siehst du nur die Demo mit UN 1203.'

/** site facts: keep them in line with the landing page, FAQ and static/llms.txt */
export const UPSELL_BENEFITS = [
  'Alle 16.730 Einträge aus ADR, RID, IMDG, ICAO und den UN-Modellvorschriften statt nur der Demo mit UN 1203',
  '1.354 Sondervorschriften im Volltext',
  'Den Regelwerksvergleich: ADR, RID, IMDG und ICAO nebeneinander für jede UN-Nummer',
  'Den ADR-Text mit Volltextsuche',
] as const

export const UPSELL_CTA = 'Jetzt freischalten'
export const UPSELL_LATER = 'Später'

/** the banner's short pitch, shown between two modals */
export const UPSELL_BANNER_PITCH = 'Dein Konto ist noch nicht freigeschaltet – du siehst nur die Demo mit UN 1203.'

/** the banner's pitch on phones, where it shares one row with the button */
export const UPSELL_BANNER_PITCH_SHORT = 'Noch nicht freigeschaltet – nur Demo (UN 1203).'
