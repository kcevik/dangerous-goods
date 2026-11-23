import { REFERENCED_SECTIONS } from '$lib/points/duties'
import { getBookIndex } from '$lib/server/adrBook/index'
import type { PageServerLoad } from './$types'

/**
 * The calculator itself runs in the browser and asks `./eintrag` per UN number.
 * Locked accounts get no calculator and nothing is read for them.
 */
export const load: PageServerLoad = async ({ parent }) => {
  const { isActive } = await parent()
  if (!isActive) return { locked: true as const }
  return { locked: false as const, linkedSections: linkedSections() }
}

/**
 * Paragraph references link into the ADR viewer only where the book has them as headings —
 * many paragraph numbers (e.g. 1.1.3.6.2) are not, and a link would land on "nicht gefunden".
 * Without a book (ADR_BOOK_PATH unset or broken) the references stay plain text.
 */
function linkedSections(): string[] {
  try {
    const headings = new Set(getBookIndex().headings.map(h => h.sectionNo))
    return REFERENCED_SECTIONS.filter(s => headings.has(s))
  }
  catch {
    return []
  }
}
