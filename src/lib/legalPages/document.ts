import { FACT_LABELS, type FactKey, type LegalFacts } from './facts'

/**
 * A legal text as plain blocks. `{factKey}` tokens are filled from `LegalFacts`;
 * `\n` inside a paragraph is a line break (address blocks).
 */
export type LegalBlock =
  | { kind: 'h2' | 'h3' | 'p', text: string, requires?: FactKey }
  | { kind: 'ul', items: string[], requires?: FactKey }

export interface LegalDocument {
  title: string
  /** one sentence for the meta description */
  description?: string
  blocks: LegalBlock[]
}

export interface FilledDocument {
  title: string
  description?: string
  blocks: LegalBlock[]
  /** labels of the facts still unknown, in order of first use, each once */
  missing: string[]
}

const TOKEN = /\{([a-zA-Z]+)\}/g

export function fillDocument(document: LegalDocument, facts: LegalFacts): FilledDocument {
  const missing: string[] = []

  const fill = (text: string): string =>
    text.replace(TOKEN, (match, key: string) => {
      if (!(key in facts)) return match
      const value = facts[key as FactKey]
      if (typeof value === 'string' && value !== '') return value
      const label = FACT_LABELS[key as FactKey]
      if (!missing.includes(label)) missing.push(label)
      return `[[${label}]]`
    })

  const blocks: LegalBlock[] = []
  for (const block of document.blocks) {
    if (block.requires && facts[block.requires] === false) continue
    blocks.push(block.kind === 'ul'
      ? { kind: 'ul', items: block.items.map(fill) }
      : { kind: block.kind, text: fill(block.text) })
  }

  return { title: document.title, description: document.description, blocks, missing }
}
