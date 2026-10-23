/**
 * What removing a customer would cost — module 5, block F's two exits.
 *
 * The screen's footer band and both confirmation dialogs are built from these
 * counts, and they are the one thing on that screen that must not be
 * approximate: a sentence saying `2 quotes, 1 job will be destroyed` is the
 * last thing he reads before an irreversible act.
 *
 * **Two list reads, both scoped to her.** `GET /quotes?customer_id=` and
 * `GET /jobs?customer_id=` each filter server-side, so this asks for her
 * records rather than for everyone's and counting. They are fired together.
 *
 * Archived records are counted. Deleting her destroys them too — an archived
 * quote is hidden, not gone — so a count that left them out would promise less
 * damage than the act does.
 */

import type { ApiJobRecord } from '@/types/jobApi'
import type { ApiQuoteRecord } from '@/types/quoteApi'
import type { RemovalFigures } from '@/types/customerDetail'
import { formatMonthName } from '@/utils/format'
import { apiGet } from './http'

export async function fetchRemovalFigures(
  customerId: number,
  signal?: AbortSignal,
): Promise<RemovalFigures> {
  // Both must answer. Unlike the quote list, a partial count here is not a
  // degraded screen — it is a sentence that understates what deleting her
  // destroys, said to someone about to press the button. If either read fails
  // this query fails, and the view keeps both exits shut.
  const [quotes, jobs] = await Promise.all([
    apiGet<ApiQuoteRecord[]>(
      '/quotes',
      { customer_id: customerId, include_archived: 'true' },
      signal,
    ),
    apiGet<ApiJobRecord[]>(
      '/jobs',
      { customer_id: customerId, include_archived: 'true' },
      signal,
    ),
  ])

  const recordCounts = [
    countPhrase(quotes.length, 'quote'),
    countPhrase(jobs.length, 'job'),
  ].filter((phrase): phrase is string => phrase !== null)

  return {
    records: recordCounts.length ? recordCounts.join(', ') : 'nothing else',
    recordCounts,
    anonymousLabel: anonymousLabelFor(customerId),
    month: hollowedMonth(jobs),
  }
}

/** `2 quotes`, `1 job` — and nothing at all for a kind she has none of. */
function countPhrase(count: number, noun: string): string | null {
  if (count === 0) return null
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

/**
 * The month a delete leaves a hole in: the one her most recent job's money
 * landed in.
 *
 * Earned at completion, so `completed_at` is the date that matters; a job still
 * on site falls back to when it was scheduled and then to when it was made, so
 * the sentence still names a month rather than going quiet about a job that
 * exists.
 */
function hollowedMonth(jobs: ApiJobRecord[]): string | null {
  const dates = jobs
    .map((job) => job.completed_at ?? job.scheduled_for ?? job.created_at)
    .map((iso) => Date.parse(iso))
    .filter((ms) => Number.isFinite(ms))

  if (!dates.length) return null
  return formatMonthName(new Date(Math.max(...dates)).toISOString())
}

/**
 * `Customer #0141` — the name she is left under once she is anonymised.
 *
 * ⚠️ **The one value on this screen with no endpoint behind it.** The label is
 * minted by `POST /customers/{id}/anonymise` and comes back on the record; it
 * cannot be read before the act, and the act is exactly what the dialog is
 * asking him to confirm. So the dialog names it by the convention — her id,
 * padded — and the screen replaces it with the server's own answer the moment
 * the act returns (see `CustomerDetailView`). If the server ever words its
 * placeholder differently, this is the line that says so first.
 */
export const anonymousLabelFor = (customerId: number) =>
  `Customer #${String(customerId).padStart(4, '0')}`
