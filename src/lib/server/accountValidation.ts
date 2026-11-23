import { ADDRESS_FIELDS, type AddressField, type AddressValues, type BillingAddress } from '$lib/account/address'
import { isCountryCode, isValidPostalCode } from '$lib/account/countries'

export type AddressErrorCode
  = 'required'
    | 'too_long'
    | 'invalid_chars'
    | 'invalid_country'
    | 'invalid_postal_code'
    | 'invalid_vat_id'
    | 'vat_id_needs_company'

export type AddressErrors = Partial<Record<AddressField, AddressErrorCode>>

export type AddressValidation
  = { ok: true, address: BillingAddress }
    | { ok: false, errors: AddressErrors, values: AddressValues }

/** C0/C1 controls, bidi overrides and other format characters never belong in an address. */
const CONTROL_CHARS = /[\p{Cc}\p{Cf}]/u

const MAX_LENGTH: Record<'company' | 'firstName' | 'lastName' | 'street' | 'city', number> = {
  company: 200,
  firstName: 100,
  lastName: 100,
  street: 200,
  city: 100,
}

const VAT_ID_GENERIC = /^[A-Z]{2}[A-Z0-9]{2,13}$/
const VAT_ID_RULES: Record<string, RegExp> = {
  DE: /^DE\d{9}$/,
  AT: /^ATU\d{8}$/,
}

/** VAT IDs are written with spaces, dots or dashes; the canonical form has none. */
export function normalizeVatId(v: string): string {
  return v.replace(/[\s.-]/g, '').toUpperCase()
}

function isValidVatId(vatId: string): boolean {
  if (!VAT_ID_GENERIC.test(vatId)) return false
  const rule = VAT_ID_RULES[vatId.slice(0, 2)]
  return rule ? rule.test(vatId) : true
}

function raw(form: FormData, key: AddressField): string {
  const v = form.get(key)
  return typeof v === 'string' ? v : ''
}

/** Trim + collapse inner whitespace (control characters stay, so they can be reported). */
function clean(v: string): string {
  return v.replace(/[ \t\r\n ]+/g, ' ').trim()
}

/** Server-side validation of the billing address form. Errors are per field. */
export function validateAddress(form: FormData): AddressValidation {
  const values = {} as AddressValues
  for (const key of ADDRESS_FIELDS) values[key] = clean(raw(form, key))
  values.postalCode = values.postalCode.toUpperCase()
  values.vatId = normalizeVatId(values.vatId)

  const errors: AddressErrors = {}

  for (const key of ['company', 'firstName', 'lastName', 'street', 'city'] as const) {
    const v = values[key]
    if (v === '') {
      if (key !== 'company') errors[key] = 'required'
    }
    else if (CONTROL_CHARS.test(v)) errors[key] = 'invalid_chars'
    else if (v.length > MAX_LENGTH[key]) errors[key] = 'too_long'
  }

  const country = values.country
  if (!isCountryCode(country)) errors.country = 'invalid_country'

  if (values.postalCode === '') errors.postalCode = 'required'
  else if (isCountryCode(country) && !isValidPostalCode(country, values.postalCode)) errors.postalCode = 'invalid_postal_code'
  else if (!isCountryCode(country) && values.postalCode.length > 10) errors.postalCode = 'invalid_postal_code'

  if (values.vatId !== '') {
    if (values.company === '') errors.vatId = 'vat_id_needs_company'
    else if (!isValidVatId(values.vatId)) errors.vatId = 'invalid_vat_id'
  }

  if (Object.keys(errors).length > 0 || !isCountryCode(country)) return { ok: false, errors, values }

  return {
    ok: true,
    address: {
      company: values.company || null,
      firstName: values.firstName,
      lastName: values.lastName,
      street: values.street,
      postalCode: values.postalCode,
      city: values.city,
      country,
      vatId: values.vatId || null,
    },
  }
}
