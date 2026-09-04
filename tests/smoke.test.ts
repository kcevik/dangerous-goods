import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Counter from './fixtures/Counter.svelte'

describe('vitest + jsdom + svelte setup', () => {
  it('mounts a runes component and reacts to a click', async () => {
    render(Counter)
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('0')
    await fireEvent.click(button)
    expect(button).toHaveTextContent('1')
  })
})
