// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { latexToHtml, repairSourceLine } from '$lib/server/adrBook/sourceFixes'

describe('repairSourceLine – orphaned bold paragraph numbers', () => {
  it('restores the lost opening ** in a list item', () => {
    expect(repairSourceLine('- 1.8.3.4** Die Funktion des Gefahrgutbeauftragten'))
      .toBe('- **1.8.3.4** Die Funktion des Gefahrgutbeauftragten')
  })

  it('restores it on a bare paragraph line and at the end of a line', () => {
    expect(repairSourceLine('2.2.41.1.10** Die Zersetzung')).toBe('**2.2.41.1.10** Die Zersetzung')
    expect(repairSourceLine('- 1.6.3.4**')).toBe('- **1.6.3.4**')
  })

  it('restores it for any bold run whose start was lost', () => {
    expect(repairSourceLine('- Bem.** 1. Der Wert von 54000 MJ')).toBe('- **Bem.** 1. Der Wert von 54000 MJ')
    expect(repairSourceLine('Druckgefäße und Gefäße für die Klasse 2**')).toBe('**Druckgefäße und Gefäße für die Klasse 2**')
    expect(repairSourceLine('- 1.6.1.9** **und**')).toBe('- **1.6.1.9** **und**')
    expect(repairSourceLine('#### 1.9.5 Tunnelbeschränkungen**')).toBe('#### **1.9.5 Tunnelbeschränkungen**')
  })

  it('leaves table rows and stereo descriptors alone', () => {
    for (const line of [
      '| TF4 | Gegenstände** | TS |',
      '- ([3R-(3R,5aS,6S,8aS,9R,10R,12S, 12aR**)]-DECAHYDRO',
    ]) expect(repairSourceLine(line)).toBe(line)
  })

  it('leaves correctly bolded numbers, headings and prose alone', () => {
    for (const line of [
      '**1.8.6.3.3.4** Tätigkeiten dürfen nicht',
      '##### **1.1.3.6 Freistellungen**',
      '- 163 Ein in Kapitel 3.2 Tabelle A',
      '**376** **Lithium-Metall-Batterien**',
    ]) expect(repairSourceLine(line)).toBe(line)
  })
})

describe('latexToHtml / repairSourceLine – formulas', () => {
  it('renders sub- and superscripts as the markup the source already uses', () => {
    expect(repairSourceLine('den  $A_2$ -Wert überschreitet')).toBe('den  A<sub>2</sub> -Wert überschreitet')
    expect(latexToHtml('1 \\times 10^6')).toBe('1 × 10<sup>6</sup>')
    expect(latexToHtml('6 \\times 10^{-1}')).toBe('6 × 10<sup>-1</sup>')
    expect(latexToHtml('LC_{50}')).toBe('LC<sub>50</sub>')
  })

  it('maps the symbols the conversion used', () => {
    expect(latexToHtml('\\leq 25')).toBe('≤ 25')
    expect(latexToHtml('\\geq 1')).toBe('≥ 1')
    expect(latexToHtml('\\alpha')).toBe('α')
    expect(latexToHtml('-182\\text{ }^{\\circ}\\text{C}')).toBe('-182 °C')
    expect(latexToHtml('\\text{Masse-\\%}')).toBe('Masse-%')
  })

  it('writes fractions inline, with parentheses around compound parts', () => {
    expect(latexToHtml('\\frac{A_i}{T_i}')).toBe('A<sub>i</sub> / T<sub>i</sub>')
    expect(latexToHtml('\\frac{1}{\\sum_{i=1}^n \\frac{f_i}{T_i}}'))
      .toBe('1 / (Σ<sub>i=1</sub><sup>n</sup> f<sub>i</sub> / T<sub>i</sub>)')
  })

  it('escapes comparison signs so they stay text', () => {
    expect(latexToHtml('\\sum_i \\frac{A_i}{T_i} < 1,')).toBe('Σ<sub>i</sub> A<sub>i</sub> / T<sub>i</sub> &lt; 1,')
  })

  it('handles display formulas and leaves a line without a formula untouched', () => {
    expect(repairSourceLine('$$R = \\sum_{i=1}^n \\frac{V_i}{LC_{50i}}$$'))
      .toBe('R = Σ<sub>i=1</sub><sup>n</sup> V<sub>i</sub> / LC<sub>50i</sub>')
    expect(repairSourceLine('Preis 5 $ pro Stück')).toBe('Preis 5 $ pro Stück')
  })

  it('never loses the text after a stray closing brace', () => {
    expect(latexToHtml('a } b')).toBe('a b')
  })
})
