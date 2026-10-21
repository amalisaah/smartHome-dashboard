/**
 * The quote list's view model — modules 3+4, block D.
 *
 * Everything on a row is **supplied**. The list renders days waiting, the
 * "edited … ago" phrase, the answered date and the row order; it does not
 * compute any of them. That is not laziness about dates: `19` and `edited 2 h
 * ago` are the server's reading of a clock the phone may not agree with, and a
 * list that recalculated them would show one number while the quote behind it
 * showed another.
 *
 * **No amount appears on this type at all** (gap report B1). The amount is one
 * tap in, on the quote itself. A list field nobody renders is a field somebody
 * eventually renders, so there isn't one.
 */

import type { RouteLocationRaw } from 'vue-router'

/** `draft -> sent -> accepted | declined`, as the wire has it. */
export type QuoteListStatus = 'draft' | 'sent' | 'accepted' | 'declined'

/** One row, in the shape both devices render it. */
export interface QuoteListRow {
  /** The route param. */
  id: number
  /** `0139` — the number as he says it out loud, zero-padded by whoever supplies it. */
  number: string
  status: QuoteListStatus
  surname: string
  area: string
  /** Lowercase, always: `basic`, `comfortable`, `premium`, `luxury`, `custom`. */
  level: string
  /** Set only when he named this quote — what tells two quotes for one family apart. */
  title: string | null
  /** `sent` only. Supplied: the server's count, not this device's clock. */
  daysWaiting: number | null
  /** `draft` only, already phrased — `edited 2 h ago`. */
  editedText: string | null
  /** `accepted` and `declined` only — `6 Oct`. */
  answeredOn: string | null
  /** `accepted` only: the job the acceptance created. */
  jobNumber: string | null
  /**
   * `declined` only, and usually empty — he writes one down when she gives a
   * reason worth keeping. Empty renders **nothing**: no placeholder, no dash.
   * A dash would read as a reason he recorded.
   */
  declinedReason: string | null
}

/** Which of the three states a row belongs to. */
export type QuoteListTab = 'waiting' | 'drafts' | 'answered'

export interface QuoteListTabDef {
  id: QuoteListTab
  /** The phone's segment. */
  label: string
  /** The laptop's column heading, which has room to say who is being waited on. */
  columnLabel: string
  /** The one line under the tabs, and under each column header. Same copy. */
  hint: string
  holds: (row: QuoteListRow) => boolean
}

/**
 * **Waiting · Drafts · Answered**, and the order is the point: he opens this
 * screen to find out who to chase, so the answer is the first thing under his
 * thumb and the leftmost column under his cursor.
 */
export const QUOTE_LIST_TABS: readonly QuoteListTabDef[] = [
  {
    id: 'waiting',
    label: 'Waiting',
    columnLabel: 'Waiting on her',
    hint: 'Sent, no answer yet. Oldest first, so the top one is the one to chase.',
    holds: (row) => row.status === 'sent',
  },
  {
    id: 'drafts',
    label: 'Drafts',
    columnLabel: 'Drafts',
    hint: 'Not sent yet. Last edited first.',
    holds: (row) => row.status === 'draft',
  },
  {
    id: 'answered',
    label: 'Answered',
    columnLabel: 'Answered',
    hint: 'Last 30 days. Accepted quotes lead to their job.',
    holds: (row) => row.status === 'accepted' || row.status === 'declined',
  },
]

export const isQuoteListTab = (raw: unknown): QuoteListTab | null =>
  QUOTE_LIST_TABS.some((tab) => tab.id === raw) ? (raw as QuoteListTab) : null

/**
 * Name, area or number — and nothing else. Deliberately not the level or the
 * title: typing `premium` would answer with every premium quote he has, which
 * is a report rather than the one row he is looking for.
 */
export function quoteRowMatches(row: QuoteListRow, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return `${row.surname} ${row.area} ${row.number}`.toLowerCase().includes(needle)
}

/**
 * Where a row goes when tapped: **the quote**, whatever state it is in.
 *
 * The row stays one hit target with no buttons inside it. The handoff sends a
 * sent row straight to block B instead, on the grounds that the only reason he
 * taps one is that she has answered — but that leaves a quote he merely wants
 * to look at with nowhere to be looked at, and gives one list four URL shapes
 * for the same kind of thing. One address per quote; what the quote needs next
 * is the primary action on its own page, one tap further on.
 */
export function quoteRowDestination(row: QuoteListRow): RouteLocationRaw {
  return { name: 'quote-detail', params: { id: row.id } }
}

/**
 * The blue line at the foot of a row — sent and accepted only.
 *
 * It names what the quote needs next rather than where the tap lands, and the
 * page it lands on offers exactly that as its primary action.
 */
export function quoteRowActionHint(row: QuoteListRow): string | null {
  if (row.status === 'sent') return 'Record her answer ›'
  if (row.status === 'accepted' && row.jobNumber) return `Job ${row.jobNumber} ›`
  return null
}

/** `Quote 0146 · custom · Gate + two cameras`. */
export function quoteRowSubtitle(row: QuoteListRow): string {
  const base = `Quote ${row.number} · ${row.level}`
  return row.title ? `${base} · ${row.title}` : base
}
