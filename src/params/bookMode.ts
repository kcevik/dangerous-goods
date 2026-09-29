import type { ParamMatcher } from '@sveltejs/kit'
import { BOOK_MODES, type BookMode } from '$lib/regulations/bookTypes'

/** `/regelwerk/[mode=bookMode]` — only modes that have a book; anything else is a 404. */
export const match = ((param: string): param is BookMode =>
  (BOOK_MODES as readonly string[]).includes(param)) satisfies ParamMatcher
