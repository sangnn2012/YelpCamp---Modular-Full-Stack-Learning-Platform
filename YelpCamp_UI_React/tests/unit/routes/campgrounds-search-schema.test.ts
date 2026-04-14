import { describe, expect, it } from 'vitest'
import { z } from 'zod'

// Mirror of the searchSchema used by src/routes/campgrounds/index.tsx.
// Kept here as a dedicated unit because TanStack Router hands URL params in
// as STRINGS, so a naive z.number() rejects `?page=1` and breaks the search UX.
// Regression: this was the exact bug where clicking "Search" caused the list
// route to error out as soon as the URL gained a ?page=… query string.
const searchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).default(1),
  search: z.string().optional(),
})

describe('campgrounds route searchSchema', () => {
  it('coerces URL-string page values into numbers', () => {
    // TanStack Router hands params in as strings from the URL, not numbers.
    expect(searchSchema.parse({ page: '3' })).toEqual({ page: 3 })
  })

  it('defaults to page 1 when nothing is provided', () => {
    expect(searchSchema.parse({})).toEqual({ page: 1 })
  })

  it('falls back to page 1 when the value is garbage (never crashes the route)', () => {
    // Without .catch(1), a rogue ?page=abc would blow up the whole route render.
    expect(searchSchema.parse({ page: 'abc' })).toEqual({ page: 1 })
    expect(searchSchema.parse({ page: '-5' })).toEqual({ page: 1 })
    expect(searchSchema.parse({ page: '0' })).toEqual({ page: 1 })
  })

  it('keeps the search string when provided', () => {
    expect(searchSchema.parse({ page: '2', search: 'canyon' })).toEqual({
      page: 2,
      search: 'canyon',
    })
  })

  it('leaves search undefined when the param is missing', () => {
    const result = searchSchema.parse({ page: '1' })
    expect(result.search).toBeUndefined()
  })
})
