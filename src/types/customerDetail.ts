/**
 * Module 5, block F — the customer detail screen.
 *
 * Everything here is **supplied**. The handoff is explicit that the UI renders
 * these and computes none of them: the last-contact phrase, the history and its
 * ordering, the house counts, the fault text, the records a removal takes or
 * leaves, the anonymous label and the month a delete costs. Nothing in this file
 * is a rule — it is the shape of an answer the screen is given.
 *
 * `CustomerRecord` (block D) is still the record: name, phone, status, notes come
 * from `GET /customers/{id}`. This is what the detail screen needs *beside* it.
 */

import type { CustomerStatus } from '@/types/customers'

/**
 * A run of text inside a line, with the one emphasis the handoff draws. Copy is
 * modelled rather than interpolated because the counts inside it are bold and
 * the rest is not — `2 quotes` is the figure, `and` is the sentence.
 */
export interface CopySegment {
  text: string
  /** Weight 600 — a count, or the word the whole line turns on. */
  strong?: boolean
  /** One ink quieter — the aside at the end of a list or a block. */
  quiet?: boolean
}

export type CopyLine = CopySegment[]

/** The three looks a history entry takes. Supplied, never inferred from a note. */
export type HistoryEntryKind = 'note' | 'no-note' | 'status-change'

export interface ContactHistoryEntry {
  id: string
  /** Already formatted — `22 Sep`, or `today` for one logged this visit. */
  date: string
  kind: HistoryEntryKind
  /** `kind === 'note'`. */
  text?: string
  /** `kind === 'status-change'` — the dashed chip reads `<from> → <to>`. */
  from?: CustomerStatus
  to?: CustomerStatus
  /** The short caption beside a status change — `job completed`. */
  caption?: string
}

/**
 * One of her houses, as the detail screen lists it.
 *
 * This is everything `GET /customers/{id}/houses` can say in a single request,
 * minus the half of it this screen may not show. There is deliberately **no**
 * room count, device count or fault count here: the wire does not carry them on
 * the houses payload, and reading them would be two further calls per house.
 *
 * There is no address, area, landmark, GPS or access note either — those come
 * back on the same payload and are dropped at the mapper, because they belong
 * inside the house and this screen says so underneath the list.
 */
export interface HouseListItem {
  id: number
  /** `Spintex house`. The wire allows no name; the list says so rather than guessing. */
  name: string
  /** `internet weak` / `no internet`, or null when there is nothing to flag. */
  condition: string | null
}

/** One of the two exits, as display copy. */
export interface RemovalExit {
  title: string
  subline: string
  goes: CopyLine[]
  stays: CopyLine[]
  /** `Anonymise Ama…` — it ends in an ellipsis because it opens a confirmation. */
  button: string
}

/**
 * What the two exits say, and what the delete dialog counts. Every figure in
 * here is supplied; the UI puts them in sentences and does not add them up.
 */
export interface RemovalFigures {
  /** The counts as a list reads them — `2 quotes, 1 job`. */
  records: string
  /**
   * The same counts as a sentence says them aloud — `['2 quotes', '1 job']`, so
   * the delete dialog can bold each one and write "and" between them. One fact,
   * two readings; the UI joins them and counts nothing.
   */
  recordCounts: string[]
  /** `Customer #0141` — what she becomes. */
  anonymousLabel: string
  /** `August` — the month a delete leaves a hole in. */
  month: string
}

/** The delete dialog's cost block: three lines over the risk tint. */
export interface DeleteCost {
  lines: CopyLine[]
}

/** The anonymise dialog's body, split so the label can be bold in the middle. */
export interface AnonymiseCopy {
  before: string
  label: string
  after: string
}

/**
 * The screen's heading. It is addressed by id because anonymising replaces the
 * name under him while the button he pressed is being taken off the screen, and
 * focus has to land on the thing that changed rather than nowhere.
 */
export const HEADING_ID = 'customer-detail-heading'

/**
 * Her first name, for the button that names what it will do. Display only —
 * `her` while the record is still loading, so the band can go up with the frame
 * and still read as a sentence.
 */
export const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'her'

/**
 * The delete gate. Case and surrounding spaces ignored — he is confirming that
 * he knows whose records these are, not passing a spelling test.
 */
export const confirmsName = (typed: string, name: string) =>
  typed.trim().toLowerCase() === name.trim().toLowerCase()
