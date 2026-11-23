// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { fromRow, toRow, toValues } from '$lib/account/address'
import { isValidPostalCode } from '$lib/account/countries'
import { normalizeVatId, validateAddress } from '$lib/server/accountValidation'

const VALID = {
  company: '',
  firstName: 'Erika',
  lastName: 'Mustermann',
  street: 'Hauptstraße 12a',
  postalCode: '10115',
  city: 'Berlin',
  country: 'DE',
  vatId: '',
}

function form(fields: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.set(k, v)
  return f
}

describe('validateAddress', () => {
  it('accepts a private address and stores empty optionals as null', () => {
    expect(validateAddress(form(VALID))).toEqual({
      ok: true,
      address: { ...VALID, company: null, vatId: null },
    })
  })

  it('trims and collapses whitespace', () => {
    const r = validateAddress(form({ ...VALID, firstName: '  Erika  ', street: ' Haupt  straße   12a ', city: '\tBerlin ' }))
    expect(r).toMatchObject({ ok: true, address: { firstName: 'Erika', street: 'Haupt straße 12a', city: 'Berlin' } })
  })

  it('accepts a business address with a normalised VAT ID', () => {
    const r = validateAddress(form({ ...VALID, company: 'Muster GmbH', vatId: 'de 123.456-789' }))
    expect(r).toMatchObject({ ok: true, address: { company: 'Muster GmbH', vatId: 'DE123456789' } })
  })

  it('reports every missing required field', () => {
    const r = validateAddress(form({ ...VALID, firstName: ' ', lastName: '', street: '', postalCode: '', city: '' }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors).toEqual({
      firstName: 'required',
      lastName: 'required',
      street: 'required',
      postalCode: 'required',
      city: 'required',
    })
  })

  it('treats missing form fields as empty, not as a crash', () => {
    const r = validateAddress(new FormData())
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.firstName).toBe('required')
    expect(r.values.country).toBe('')
    expect(r.errors.country).toBe('invalid_country')
  })

  it('rejects over-long fields', () => {
    const r = validateAddress(form({ ...VALID, company: 'x'.repeat(201), firstName: 'x'.repeat(101), street: 'x'.repeat(201), city: 'x'.repeat(101) }))
    expect(r).toMatchObject({ ok: false, errors: { company: 'too_long', firstName: 'too_long', street: 'too_long', city: 'too_long' } })
  })

  it('rejects control characters', () => {
    const r = validateAddress(form({ ...VALID, lastName: 'Muster\u0000mann', city: 'Ber‮lin' }))
    expect(r).toMatchObject({ ok: false, errors: { lastName: 'invalid_chars', city: 'invalid_chars' } })
  })

  it('rejects an unknown country', () => {
    expect(validateAddress(form({ ...VALID, country: 'XX' }))).toMatchObject({ ok: false, errors: { country: 'invalid_country' } })
    expect(validateAddress(form({ ...VALID, country: 'de' }))).toMatchObject({ ok: false, errors: { country: 'invalid_country' } })
  })

  it('checks the postal code per country', () => {
    expect(validateAddress(form({ ...VALID, postalCode: '1011' }))).toMatchObject({ ok: false, errors: { postalCode: 'invalid_postal_code' } })
    expect(validateAddress(form({ ...VALID, country: 'AT', postalCode: '1010' }))).toMatchObject({ ok: true })
    expect(validateAddress(form({ ...VALID, country: 'AT', postalCode: '10115' }))).toMatchObject({ ok: false, errors: { postalCode: 'invalid_postal_code' } })
    expect(validateAddress(form({ ...VALID, country: 'CH', postalCode: '8001' }))).toMatchObject({ ok: true })
    expect(validateAddress(form({ ...VALID, country: 'NL', postalCode: '1012 ab' }))).toMatchObject({ ok: true, address: { postalCode: '1012 AB' } })
  })

  it('rejects a VAT ID without a company', () => {
    expect(validateAddress(form({ ...VALID, vatId: 'DE123456789' }))).toMatchObject({ ok: false, errors: { vatId: 'vat_id_needs_company' } })
  })

  it('rejects malformed VAT IDs', () => {
    for (const vatId of ['DE12345678', 'DE1234567890', 'ATU1234567', 'AT12345678', '123456789', 'D']) {
      expect(validateAddress(form({ ...VALID, company: 'Muster GmbH', vatId })), vatId)
        .toMatchObject({ ok: false, errors: { vatId: 'invalid_vat_id' } })
    }
    expect(validateAddress(form({ ...VALID, company: 'Muster GmbH', vatId: 'ATU12345678' }))).toMatchObject({ ok: true })
    expect(validateAddress(form({ ...VALID, company: 'Muster GmbH', vatId: 'FRXX123456789' }))).toMatchObject({ ok: true })
  })

  it('returns the trimmed values for refilling the form', () => {
    const r = validateAddress(form({ ...VALID, firstName: '  Erika ', postalCode: 'abc' }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.values).toMatchObject({ firstName: 'Erika', postalCode: 'ABC' })
  })
})

describe('normalizeVatId', () => {
  it('removes spaces, dots and dashes and upper-cases', () => {
    expect(normalizeVatId(' de 123-456.789 ')).toBe('DE123456789')
  })
})

describe('isValidPostalCode', () => {
  it('uses the fallback rule for countries without a specific one', () => {
    expect(isValidPostalCode('GB', 'SW1A 1AA')).toBe(true)
    expect(isValidPostalCode('GB', '-')).toBe(false)
  })
})

describe('address row mapping', () => {
  it('round-trips between the app shape and the table row', () => {
    const address = { company: 'Muster GmbH', firstName: 'Erika', lastName: 'Mustermann', street: 'Hauptstraße 12a', postalCode: '10115', city: 'Berlin', country: 'DE' as const, vatId: 'DE123456789' }
    const row = toRow('u1', address)
    expect(row).toMatchObject({ user_id: 'u1', first_name: 'Erika', postal_code: '10115', vat_id: 'DE123456789' })
    expect(fromRow(row)).toEqual(address)
  })

  it('gives empty form values with Deutschland as default country', () => {
    expect(toValues(null)).toEqual({ company: '', firstName: '', lastName: '', street: '', postalCode: '', city: '', country: 'DE', vatId: '' })
  })
})
