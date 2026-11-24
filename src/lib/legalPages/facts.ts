/**
 * Facts the legal texts need about the operator and the paid plan.
 *
 * `null`  = not known yet → the page shows `[[label]]`, a draft banner and `noindex`.
 * `false` = does not apply (e.g. no register entry for a sole trader) → the block is left out.
 *
 * Fill these in once the company exists; nothing else needs to change. The texts are drafts:
 * have them checked by a lawyer before launch.
 */
export interface LegalFacts {
  /** company name incl. legal form, e.g. "Muster GmbH" */
  companyName: string | null | false
  /** managing director(s) / legal representative */
  representative: string | null | false
  street: string | null | false
  postalCode: string | null | false
  city: string | null | false
  email: string | null | false
  phone: string | null | false
  registerCourt: string | null | false
  registerNumber: string | null | false
  /** USt-IdNr. (§ 27a UStG); false for a small business without one */
  vatId: string | null | false
  /** name and address of the person responsible for content under § 18 Abs. 2 MStV */
  contentResponsible: string | null | false
  /** who sends the transactional e-mails (confirmation, password reset) */
  mailProvider: string | null | false
  /** how long the web server keeps access logs, e.g. "14 Tagen" */
  logRetention: string | null | false
  /**
   * the one plan's price as shown everywhere (sales modal, banner, `/konto`, AGB) — read it
   * through `planPrice()`, never retype it
   */
  price: string | null | false
  /** e.g. "monatlich im Voraus" */
  billingPeriod: string | null | false
  /** minimum term, e.g. "einen Monat" */
  minimumTerm: string | null | false
}

export type FactKey = keyof LegalFacts

export const LEGAL_FACTS: LegalFacts = {
  // sole proprietor / private person until a company exists (owner, 2026-11-24)
  companyName: 'Can Cevik',
  representative: false,
  street: 'Ackerstrasse 25C',
  postalCode: '33330',
  city: 'Gütersloh',
  email: 'info@gefahrgut.org',
  phone: false,
  registerCourt: false,
  registerNumber: false,
  vatId: false, // none while nothing is sold (owner, 2026-11-24)
  contentResponsible: 'Can Cevik, Ackerstrasse 25C, 33330 Gütersloh',
  mailProvider: 'die STRATO AG, Otto-Ostrowski-Straße 7, 10249 Berlin', // verify the entity in Strato's own privacy policy
  logRetention: '14 Tagen', // journald MaxRetentionSec=14day on the server
  // owner decision 2026-11-23: 125 € gross per month
  price: '125 € pro Monat inkl. MwSt.',
  billingPeriod: 'monatlich im Voraus',
  minimumTerm: null,
}

/** German labels for the placeholders and the draft banner */
export const FACT_LABELS: Record<FactKey, string> = {
  companyName: 'Firma und Rechtsform',
  representative: 'Vertretungsberechtigte Person',
  street: 'Straße und Hausnummer',
  postalCode: 'PLZ',
  city: 'Ort',
  email: 'E-Mail-Adresse',
  phone: 'Telefonnummer',
  registerCourt: 'Registergericht',
  registerNumber: 'Registernummer',
  vatId: 'USt-IdNr.',
  contentResponsible: 'Verantwortlich nach § 18 MStV (Name, Anschrift)',
  mailProvider: 'E-Mail-Versanddienst',
  logRetention: 'Speicherdauer der Server-Logs',
  price: 'Preis',
  billingPeriod: 'Abrechnungszeitraum',
  minimumTerm: 'Mindestlaufzeit',
}

/** date shown as "Stand:" on every legal page; change it with every content change */
export const LEGAL_UPDATED = '24.11.2026'

/** the plan price for display, or null while it is not set */
export function planPrice(facts: LegalFacts = LEGAL_FACTS): string | null {
  return typeof facts.price === 'string' && facts.price !== '' ? facts.price : null
}
