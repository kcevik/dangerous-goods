/**
 * Line-level repairs of conversion artefacts in the ADR source.
 *
 * The book is a machine conversion of a PDF (see CLAUDE.md: "The ADR source is
 * OCR-corrupted"). Two artefacts are mechanical enough to repair without
 * guessing at the regulation's wording:
 *
 * 1. **Orphaned closing `**`.** About 1,400 lines read `- 1.8.3.4** Die
 *    Funktion …` or `Bem.** 1. Der Wert …`: the opening `**` was lost, so the
 *    reader sees stray asterisks. The opening marker goes back where the bold
 *    run began, at the start of the line's text: `- **1.8.3.4** Die Funktion …`.
 * 2. **LaTeX formulas.** The converter wrote quantities and formulas as `$…$`
 *    (`$A_2$`, `$1 \times 10^6$`, `$\leq 25$`). They become plain text with
 *    `<sub>`/`<sup>`, the markup the source already uses everywhere else.
 *
 * Applied once per line when the book is loaded, before indexing, so the index,
 * the free-text search, the slicer and the renderer all see the same text — the
 * find bar's counter and the page's marks must never disagree. Each line maps to
 * exactly one line, so line numbers (and every deep link) are unchanged.
 *
 * Pure: no I/O.
 */

/** Indentation, then an optional heading or list marker: where a line's text starts. */
const LINE_PREFIX = /^(\s*(?:#{1,6}[ \t]+|[-*+][ \t]+)?)/

/**
 * A closing `**` with no opening one before it: the line's first `**` follows
 * text and is followed by a space or the line end, and the line has an odd
 * number of them. Table rows are left alone (a cell boundary would have to be
 * guessed), and so is `12aR**)` in a chemical name, which is not followed by a space.
 */
function repairOrphanBold(line: string): string {
  if (/^\s*\|/.test(line)) return line
  const count = line.split('**').length - 1
  if (count % 2 === 0) return line
  const prefix = LINE_PREFIX.exec(line)![1]!
  const text = line.slice(prefix.length)
  const first = text.indexOf('**')
  if (first <= 0 || /\s/.test(text[first - 1]!)) return line
  const after = text[first + 2]
  if (after !== undefined && !/\s/.test(after)) return line
  return `${prefix}**${text}`
}

/** `$…$` or `$$…$$` on one line; the content never contains a `$`. */
const MATH = /\$\$([^$]+)\$\$|\$([^$\s](?:[^$]*[^$\s])?)\$/g

const SYMBOLS: Record<string, string> = {
  times: '×', cdot: '·', div: '÷', pm: '±',
  leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', approx: '≈',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', varepsilon: 'ε',
  eta: 'η', theta: 'θ', lambda: 'λ', mu: 'µ', nu: 'ν', pi: 'π', rho: 'ρ', sigma: 'σ',
  tau: 'τ', phi: 'φ', varphi: 'φ', omega: 'ω', Omega: 'Ω',
  sum: 'Σ', infty: '∞', circ: '°', dots: '…', ldots: '…', cdots: '…',
  rightarrow: '→', to: '→', log: 'log', ln: 'ln',
  quad: ' ', qquad: ' ',
}

/** Commands whose braced argument is shown as plain text. */
const TEXT_COMMANDS = new Set(['text', 'mathrm', 'mathit', 'mathbf', 'textrm', 'operatorname', 'mbox'])

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * A tiny recursive reader for the LaTeX subset the conversion produced. Unknown
 * commands lose their backslash rather than failing: a slightly odd formula is
 * still readable, a raw `$\frac{…}$` is not.
 */
class MathReader {
  private at = 0
  constructor(private readonly src: string) {}

  /** The whole formula; a stray `}` is dropped instead of ending the read. */
  all(): string {
    let out = this.sequence()
    while (this.at < this.src.length) {
      this.at++
      out += this.sequence()
    }
    return out
  }

  /** Reads until the end or an unmatched `}`. */
  sequence(): string {
    let out = ''
    while (this.at < this.src.length && this.src[this.at] !== '}') out += this.atom()
    return out
  }

  /** A `{…}` group or a single atom, as the argument of `^`, `_` or a command. */
  private argument(): string {
    this.skipSpaces()
    if (this.src[this.at] === '{') {
      this.at++
      const inner = this.sequence()
      if (this.src[this.at] === '}') this.at++
      return inner
    }
    return this.atom()
  }

  private skipSpaces(): void {
    while (this.src[this.at] === ' ') this.at++
  }

  private atom(): string {
    const ch = this.src[this.at]!
    if (ch === '{') {
      this.at++
      const inner = this.sequence()
      if (this.src[this.at] === '}') this.at++
      return inner
    }
    if (ch === '^' || ch === '_') {
      this.at++
      const inner = this.argument()
      if (ch === '^' && inner === '°') return '°'
      return ch === '^' ? `<sup>${inner}</sup>` : `<sub>${inner}</sub>`
    }
    if (ch === '\\') return this.command()
    this.at++
    if (ch === '~') return ' '
    return escapeHtml(ch)
  }

  private command(): string {
    this.at++ // backslash
    const name = /^[a-zA-Z]+/.exec(this.src.slice(this.at))?.[0]
    if (!name) {
      // `\%`, `\,`, `\ ` and friends: a symbol or a small space
      const ch = this.src[this.at] ?? ''
      this.at++
      if (ch === ',' || ch === ';' || ch === ':' || ch === ' ') return ' '
      if (ch === '!') return ''
      return escapeHtml(ch)
    }
    this.at += name.length
    if (TEXT_COMMANDS.has(name)) return this.argument()
    if (name === 'frac') {
      const numerator = this.argument()
      const denominator = this.argument()
      return `${wrap(numerator)} / ${wrap(denominator)}`
    }
    if (name === 'sqrt') return `√${wrap(this.argument(), true)}`
    // `\left(` and `\right)` keep only the delimiter
    if (name === 'left' || name === 'right') return ''
    return SYMBOLS[name] ?? name
  }
}

/** Parentheses around a compound fraction part, so `a + b / c` keeps its meaning. */
function wrap(part: string, always = false): string {
  const plain = part.replace(/<[^>]*>/g, '')
  return always || /[\s+\-−×·/=]/.test(plain.trim()) ? `(${part.trim()})` : part
}

/** One formula's LaTeX → readable HTML text. */
export function latexToHtml(latex: string): string {
  return new MathReader(latex).all()
    .replace(/ {2,}/g, ' ')
    .trim()
}

/** Repairs one source line; see the module comment for what and why. */
export function repairSourceLine(line: string): string {
  let out = repairOrphanBold(line)
  if (out.includes('$')) {
    out = out.replace(MATH, (_whole, display: string | undefined, inline: string | undefined) => latexToHtml(display ?? inline ?? ''))
  }
  return out
}
