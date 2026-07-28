// @vitest-environment nuxt
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Waitlist from '~/components/landing/Waitlist.vue'

const fetchMock = vi.fn()

describe('LandingWaitlist', () => {
  beforeEach(() => vi.stubGlobal('$fetch', fetchMock))
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('renders form fields, consent checkbox and the free-tier teaser', () => {
    const wrapper = mount(Waitlist)
    expect(wrapper.find('#waitlist').exists()).toBe(true)
    expect(wrapper.find('input[name="name"]').exists()).toBe(true)
    expect(wrapper.find('input[name="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('5 Suchanfragen pro Monat')
  })

  it('keeps the submit button disabled until the form is valid', async () => {
    const wrapper = mount(Waitlist)
    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    await wrapper.find('input[name="name"]').setValue('Kerem')
    await wrapper.find('input[name="email"]').setValue('k@example.de')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('has a visually hidden honeypot field outside the tab order', () => {
    const wrapper = mount(Waitlist)
    const hp = wrapper.find('input[name="website"]')
    expect(hp.exists()).toBe(true)
    expect(hp.attributes('tabindex')).toBe('-1')
    expect(hp.attributes('autocomplete')).toBe('off')
  })

  it('shows the success message instead of the form after submitting', async () => {
    fetchMock.mockResolvedValue({ status: 'ok' })
    const wrapper = mount(Waitlist)
    await wrapper.find('input[name="name"]').setValue('Kerem')
    await wrapper.find('input[name="email"]').setValue('k@example.de')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Du stehst auf der Liste'))
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('shows the already-registered message', async () => {
    fetchMock.mockResolvedValue({ status: 'already_registered' })
    const wrapper = mount(Waitlist)
    await wrapper.find('input[name="name"]').setValue('Kerem')
    await wrapper.find('input[name="email"]').setValue('k@example.de')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.text()).toContain('bereits auf der Warteliste'))
  })
})
