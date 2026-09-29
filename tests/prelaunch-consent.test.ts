import { describe, expect, it } from 'vitest'
import { CONSENT_VERSION, LAUNCH_CONSENT_TEXT } from '$lib/prelaunch/consent'

// The stored consent_version must always name the text that was shown. If this
// test fails because the text changed, bump CONSENT_VERSION in the same change.
describe('launch consent', () => {
  it('pairs the version with the exact sentence shown to the reader', () => {
    expect(CONSENT_VERSION).toBe('2026-09-29')
    expect(LAUNCH_CONSENT_TEXT).toBe('Ich möchte per E-Mail informiert werden, wenn gefahrgut.org startet. Meine Adresse wird nur dafür gespeichert; ich kann jederzeit widersprechen.')
  })
})
