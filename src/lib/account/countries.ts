/** Countries offered for the billing address (ISO 3166-1 alpha-2), German names, DACH first. */
export const COUNTRIES = [
  { code: 'DE', name: 'Deutschland' },
  { code: 'AT', name: 'Österreich' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'BE', name: 'Belgien' },
  { code: 'BG', name: 'Bulgarien' },
  { code: 'DK', name: 'Dänemark' },
  { code: 'EE', name: 'Estland' },
  { code: 'FI', name: 'Finnland' },
  { code: 'FR', name: 'Frankreich' },
  { code: 'GR', name: 'Griechenland' },
  { code: 'IE', name: 'Irland' },
  { code: 'IT', name: 'Italien' },
  { code: 'HR', name: 'Kroatien' },
  { code: 'LV', name: 'Lettland' },
  { code: 'LT', name: 'Litauen' },
  { code: 'LU', name: 'Luxemburg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Niederlande' },
  { code: 'NO', name: 'Norwegen' },
  { code: 'PL', name: 'Polen' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Rumänien' },
  { code: 'SE', name: 'Schweden' },
  { code: 'SK', name: 'Slowakei' },
  { code: 'SI', name: 'Slowenien' },
  { code: 'ES', name: 'Spanien' },
  { code: 'CZ', name: 'Tschechien' },
  { code: 'HU', name: 'Ungarn' },
  { code: 'GB', name: 'Vereinigtes Königreich' },
  { code: 'CY', name: 'Zypern' },
] as const

export type CountryCode = (typeof COUNTRIES)[number]['code']

export const DEFAULT_COUNTRY: CountryCode = 'DE'

export function isCountryCode(v: unknown): v is CountryCode {
  return typeof v === 'string' && COUNTRIES.some(c => c.code === v)
}

export function countryName(code: string): string {
  return COUNTRIES.find(c => c.code === code)?.name ?? code
}

/** Postal code shape per country; countries without a rule accept 2–10 of [A-Z0-9 -]. */
const POSTAL_CODE_RULES: Partial<Record<CountryCode, RegExp>> = {
  DE: /^\d{5}$/,
  AT: /^\d{4}$/,
  CH: /^\d{4}$/,
  LI: /^\d{4}$/,
}
const POSTAL_CODE_FALLBACK = /^[A-Z0-9][A-Z0-9 -]{0,8}[A-Z0-9]$/

export function isValidPostalCode(country: CountryCode, postalCode: string): boolean {
  return (POSTAL_CODE_RULES[country] ?? POSTAL_CODE_FALLBACK).test(postalCode)
}

/** Short hint for the form, e.g. "5 Ziffern". */
export function postalCodeHint(country: string): string | null {
  if (country === 'DE') return '5 Ziffern'
  if (country === 'AT' || country === 'CH' || country === 'LI') return '4 Ziffern'
  return null
}
