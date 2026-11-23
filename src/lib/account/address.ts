import { type CountryCode, DEFAULT_COUNTRY } from './countries'

/** The billing address as the app sees it (camelCase); `billing_addresses` stores it snake_case. */
export interface BillingAddress {
  company: string | null
  firstName: string
  lastName: string
  street: string
  postalCode: string
  city: string
  country: CountryCode
  vatId: string | null
}

export const ADDRESS_FIELDS = ['company', 'firstName', 'lastName', 'street', 'postalCode', 'city', 'country', 'vatId'] as const
export type AddressField = (typeof ADDRESS_FIELDS)[number]

/** Raw form values, all strings — what the form shows and sends back after a failed submit. */
export type AddressValues = Record<AddressField, string>

export interface BillingAddressRow {
  user_id: string
  company: string | null
  first_name: string
  last_name: string
  street: string
  postal_code: string
  city: string
  country: string
  vat_id: string | null
}

/** The columns the page reads; never `select('*')`. */
export const BILLING_ADDRESS_COLUMNS = 'company, first_name, last_name, street, postal_code, city, country, vat_id'

export function toRow(userId: string, a: BillingAddress): BillingAddressRow {
  return {
    user_id: userId,
    company: a.company,
    first_name: a.firstName,
    last_name: a.lastName,
    street: a.street,
    postal_code: a.postalCode,
    city: a.city,
    country: a.country,
    vat_id: a.vatId,
  }
}

export function fromRow(row: Omit<BillingAddressRow, 'user_id'>): BillingAddress {
  return {
    company: row.company,
    firstName: row.first_name,
    lastName: row.last_name,
    street: row.street,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country as CountryCode,
    vatId: row.vat_id,
  }
}

export function toValues(a: BillingAddress | null): AddressValues {
  return {
    company: a?.company ?? '',
    firstName: a?.firstName ?? '',
    lastName: a?.lastName ?? '',
    street: a?.street ?? '',
    postalCode: a?.postalCode ?? '',
    city: a?.city ?? '',
    country: a?.country ?? DEFAULT_COUNTRY,
    vatId: a?.vatId ?? '',
  }
}
