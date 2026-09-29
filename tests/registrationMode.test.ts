// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dynamicEnv } = vi.hoisted(() => ({ dynamicEnv: {} as Record<string, string | undefined> }))
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }))

const { registrationMode } = await import('$lib/server/registrationMode')

beforeEach(() => {
  for (const key of Object.keys(dynamicEnv)) delete dynamicEnv[key]
})

describe('registrationMode', () => {
  it('is waitlist when the variable is unset (fail-closed)', () => {
    expect(registrationMode()).toBe('waitlist')
  })

  it('is open only for the exact value open, ignoring surrounding spaces', () => {
    dynamicEnv.REGISTRATION_MODE = 'open'
    expect(registrationMode()).toBe('open')
    dynamicEnv.REGISTRATION_MODE = '  open \n'
    expect(registrationMode()).toBe('open')
  })

  it.each(['', 'OPEN', 'Open', 'yes', 'true', 'waitlist', 'opened'])('treats %j as waitlist', (value) => {
    dynamicEnv.REGISTRATION_MODE = value
    expect(registrationMode()).toBe('waitlist')
  })
})
