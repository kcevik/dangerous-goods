import { fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, expect, it, vi } from 'vitest'
import PointsCalculator from '../src/lib/points/PointsCalculator.svelte'

const setUa = (ua: string) => vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua)
afterEach(() => vi.restoreAllMocks())

it('prints and shows the Safari hint only on iOS', async () => {
  window.print = vi.fn()
  setUa('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Safari')
  render(PointsCalculator, { linkedSections: [] })
  await fireEvent.click(screen.getByRole('button', { name: /Drucken/ }))
  expect(window.print).toHaveBeenCalled()
  expect(screen.getByTestId('ios-print-hint')).toBeTruthy()
})

it('shows no hint elsewhere', async () => {
  window.print = vi.fn()
  setUa('Mozilla/5.0 (X11; Linux x86_64) Chrome/120')
  render(PointsCalculator, { linkedSections: [] })
  await fireEvent.click(screen.getByRole('button', { name: /Drucken/ }))
  expect(screen.queryByTestId('ios-print-hint')).toBeNull()
})
