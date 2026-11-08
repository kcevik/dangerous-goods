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
  /** e.g. "29 € pro Monat" */
  price: string | null | false
  /** e.g. "monatlich im Voraus" */
  billingPeriod: string | null | false
  /** minimum term, e.g. "einen Monat" */
  minimumTerm: string | null | false
}

export type FactKey = keyof LegalFacts

export const LEGAL_FACTS: LegalFacts = {
  companyName: null,
  representative: null,
  street: null,
  postalCode: null,
  city: null,
  email: null,
  phone: null,
  registerCourt: null,
  registerNumber: null,
  vatId: null,
  contentResponsible: null,
  mailProvider: null,
  logRetention: null,
  price: null,
  billingPeriod: null,
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
export const LEGAL_UPDATED = '08.11.2026'
