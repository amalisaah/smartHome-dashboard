/**
 * The quote list's rows — modules 3+4, block D — built from the API.
 *
 * **Four list reads, joined here, and that is the whole cost.** `GET /quotes`
 * answers `customer_id` and `house_id` and no names (gap report C10), so the
 * household a row exists to name has to come from somewhere; `GET /customers`
 * and `GET /houses` are both unpaginated list endpoints, so the join is three
 * requests rather than two per row. `GET /jobs` is the fourth, and it is what
 * lets an accepted quote say which job it became — `quote_id` sits on the job,
 * not on the quote, so there is no other direction to read it from.
 *
 * Asking per row instead would be 1 + 3N requests — 55 for an eighteen-quote
 * list. These four are fired together, so the screen waits for the slowest
 * rather than for the sum.
 *
 * **What the handoff calls supplied, this computes.** The README lists days
 * waiting, the "edited … ago" phrase, the answered dates, the 30-day window and
 * the row order as values the UI renders and does not work out. No endpoint
 * offers any of them — only the timestamps they would be derived from — so they
 * are derived here, in one place, off one clock. Every row on a screen is
 * therefore measured against the same instant, which is the part that actually
 * mattered: a column of ages that disagree is worse than ages that are a few
 * minutes stale.
 */

import type { ApiCustomer, ApiHouse } from '@/types/api'
import type { ApiJobRecord } from '@/types/jobApi'
import type { ApiQuoteRecord } from '@/types/quoteApi'
import type { QuoteListRow } from '@/types/quoteList'
import { formatShortDate } from '@/utils/format'
import { apiGet } from './http'

/** How long an answered quote keeps its place on the list. */
const ANSWERED_WINDOW_DAYS = 30

const DAY_MS = 86_400_000

/**
 * Every customer and every house, including the ones these endpoints hide by
 * default. A quote belonging to a dormant, archived or anonymised customer is
 * still a quote on his list, and a row that could not find its household would
 * render as a number with no name on it — the one thing this screen must not
 * do. All three flags widen the answer; none of them narrows it.
 */
const ALL_CUSTOMERS = { include_dormant: 'true', archived: 'true', anonymised: 'true' }
const ALL_HOUSES = { archived: 'true' }

/**
 * A join that failed is not a list that failed.
 *
 * The quotes are the list; the other three only decorate it. If the houses
 * cannot be read, a row says `house not named` and still says which quote it is
 * and how long she has had it — which is most of what he came for. If the jobs
 * cannot be read, accepted rows lose their `Job 0103 ›` line and nothing else.
 *
 * Blanking the whole screen because one of three decorations is down would be
 * the wrong trade every time: this is the screen he opens to find out who to
 * chase, and it can answer that with quotes alone.
 */
const orEmpty = <T>(promise: Promise<T[]>): Promise<T[]> => promise.catch(() => [])

export async function fetchQuoteListRows(signal?: AbortSignal): Promise<QuoteListRow[]> {
  const [quotes, customers, houses, jobs] = await Promise.all([
    apiGet<ApiQuoteRecord[]>('/quotes', undefined, signal),
    orEmpty(apiGet<ApiCustomer[]>('/customers', ALL_CUSTOMERS, signal)),
    orEmpty(apiGet<ApiHouse[]>('/houses', ALL_HOUSES, signal)),
    orEmpty(apiGet<ApiJobRecord[]>('/jobs', undefined, signal)),
  ])

  const customerById = new Map(customers.map((row) => [row.id, row]))
  const houseById = new Map(houses.map((row) => [row.id, row]))

  /** The job an accepted quote became, keyed by the quote — how it is read. */
  const jobByQuote = new Map<number, ApiJobRecord>()
  for (const job of jobs) {
    if (job.quote_id !== null) jobByQuote.set(job.quote_id, job)
  }

  // One instant for the whole screen, taken before anything is measured.
  const now = Date.now()

  return quotes
    .filter((quote) => quote.archived_at === null && withinAnsweredWindow(quote, now))
    // Sorted as records, where the timestamps still are: once a row holds
    // `edited 6 d ago` and `26 Sep` there is nothing left to order it by.
    .sort(compareQuotes)
    .map((quote) => {
      const answered = answeredAt(quote)
      const job = jobByQuote.get(quote.id)

      return {
        id: quote.id,
        number: quoteNumber(quote.id),
        status: quote.status,
        surname: surnameOf(customerById.get(quote.customer_id)?.name),
        area: houseById.get(quote.house_id)?.label?.trim() || 'house not named',
        level: quote.level_label,
        title: quote.title?.trim() || null,
        daysWaiting: quote.status === 'sent' ? wholeDaysSince(quote.sent_at, now) : null,
        editedText:
          quote.status === 'draft' ? `edited ${agoPhrase(quote.updated_at, now)}` : null,
        answeredOn: answered === null ? null : formatShortDate(answered),
        jobNumber: job ? quoteNumber(job.id) : null,
        declinedReason: quote.declined_reason?.trim() || null,
      }
    })
}

/** When she answered, whichever way she answered. Null while it is still out. */
const answeredAt = (quote: ApiQuoteRecord): string | null =>
  quote.accepted_at ?? quote.declined_at

/**
 * Answered quotes drop off after thirty days. Not a filter he can clear: this
 * list answers "who do I chase", and a quote she replied to in June is not
 * that. A quote with no answer on it is never outside the window.
 */
function withinAnsweredWindow(quote: ApiQuoteRecord, now: number): boolean {
  const answered = answeredAt(quote)
  if (answered === null) return true
  return now - Date.parse(answered) <= ANSWERED_WINDOW_DAYS * DAY_MS
}

/** `139` → `0139`. How he says a quote or a job number out loud. */
export const quoteNumber = (id: number) => String(id).padStart(4, '0')

/**
 * `Ama Adjei` → `Adjei`. A quote is addressed to the household, and the
 * household is the family name — the same reduction the builder's header makes.
 *
 * An anonymised customer's placeholder has no family name in it, so it stands
 * whole rather than being cut down to its last word.
 */
function surnameOf(name: string | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed) return 'Unnamed'
  if (trimmed.startsWith('Customer #')) return trimmed
  return trimmed.split(/\s+/).pop() as string
}

/**
 * Whole days from a timestamp to now, never negative.
 *
 * It rounds down: a quote sent two hours ago is `0 days waiting`, not `1`.
 * Saying a day has gone by when it has not is how an app talks him into
 * chasing someone who has barely been asked. A sent quote with no `sent_at` on
 * it counts as 0 rather than blank, so the row still renders a figure.
 */
function wholeDaysSince(iso: string | null, now: number): number {
  if (iso === null) return 0
  return Math.max(0, Math.floor((now - Date.parse(iso)) / DAY_MS))
}

/**
 * `40 min ago`, `2 h ago`, `6 d ago` — how long since he last touched a draft.
 *
 * Minutes up to an hour, hours up to a day, then days. The unit coarsens as the
 * number grows because that is the precision he wants: a draft touched this
 * morning is a different thing from one touched last week, and `9431 min ago`
 * says that worse than `6 d ago`.
 */
function agoPhrase(iso: string, now: number): string {
  const minutes = Math.floor(Math.max(0, now - Date.parse(iso)) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

/**
 * The order within each state, which the list renders and never re-sorts.
 *
 * Waiting goes oldest-sent first, so the top row is the one to chase. Drafts go
 * last-edited first, so the one he was in the middle of is where he left it.
 * Answered goes most recently answered first. Between states the order does not
 * matter — each is a tab of its own on the phone and a column of its own on the
 * laptop — so one comparator covers all three.
 */
function compareQuotes(a: ApiQuoteRecord, b: ApiQuoteRecord): number {
  if (a.status === 'sent' && b.status === 'sent') {
    return stamp(a.sent_at, a.created_at) - stamp(b.sent_at, b.created_at)
  }
  if (a.status === 'draft' && b.status === 'draft') {
    return stamp(b.updated_at, b.created_at) - stamp(a.updated_at, a.created_at)
  }
  return stamp(answeredAt(b), b.created_at) - stamp(answeredAt(a), a.created_at)
}

/** The timestamp, or the quote's own birthday when it has none. */
const stamp = (iso: string | null, fallback: string) => Date.parse(iso ?? fallback)
