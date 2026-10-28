/**
 * The job screen's reads and writes — modules 3+4, block C.
 *
 * **One read opens the screen.** `GET /jobs/{id}/detail` carries the job, its
 * lines, the household's names, the slice of the quote that captions the
 * header, the owner's money summary, the payments and the costs. Without it the
 * screen cost seven requests in two waves — the job returns ids where the
 * header needs words, and the figures it compares against live on the quote.
 *
 * **Writes go to the narrow endpoints**, and each one is the smallest thing it
 * could be: a Fitted figure is a `PATCH` of one line's `quantity`, not a
 * resubmission of the job. After a write that moves money the screen re-reads
 * `/summary` alone rather than the whole payload — which is what the detail
 * endpoint itself recommends, and what keeps a keystroke's cost at one small
 * request each way.
 */

import type {
  ApiJobCompletion,
  ApiJobDetail,
  ApiJobLine,
  ApiJobSummary,
  ApiJobType,
} from '@/types/jobApi'
import { apiGet, apiSend } from './http'

/** The whole screen, in one request. */
export const fetchJobDetail = (id: number, signal?: AbortSignal) =>
  apiGet<ApiJobDetail>(`/jobs/${id}/detail`, undefined, signal)

/**
 * The money alone.
 *
 * Profit, the owed balance and the variance against the quote are all derived
 * on read from rows this screen has just changed, so after a write it is the
 * one part of the payload that can be stale — and the one part cheap enough to
 * ask for on its own.
 */
export const fetchJobSummary = (id: number, signal?: AbortSignal) =>
  apiGet<ApiJobSummary>(`/jobs/${id}/summary`, undefined, signal)

/**
 * What was actually fitted on one line.
 *
 * The `quoted_*` fields never move, so the comparison survives the correction:
 * a line he drops to 0 still knows the quote said 3, and comes back carrying
 * the `quantity_delta` that makes it a `−3`.
 */
export const setFittedQuantity = (lineId: number, quantity: number) =>
  apiSend<ApiJobLine>('PATCH', `/job-lines/${lineId}`, { quantity })

/**
 * Which of the four things completing will do to her house record.
 *
 * Sent on the tap rather than on a settle. It is a radio, not a field being
 * typed: there is no half-finished state to wait out, and the sentence beneath
 * it has already changed.
 */
export const setJobType = (id: number, jobType: ApiJobType) =>
  apiSend<ApiJobDetail>('PATCH', `/jobs/${id}`, { job_type: jobType })

/**
 * What she is being charged.
 *
 * This writes the **job's** `agreed_total_pesewas`, which is the field profit
 * and owed are both derived from — so a figure he types here is one the dark
 * card and the Owed tile immediately agree with. The quote's own agreed total
 * is left alone, and goes on captioning the field with what she originally
 * agreed to.
 */
export const setAgreedTotal = (id: number, agreedTotalPesewas: number) =>
  apiSend<ApiJobDetail>('PATCH', `/jobs/${id}`, { agreed_total_pesewas: agreedTotalPesewas })

/**
 * Draw the devices out of stock, write the house record, earn the money.
 *
 * **Stock may go negative and that never blocks it** — a device installed the
 * day it arrived, before the shipment was logged, is a true negative rather
 * than a mistake. The response names what went under, and the screen says so
 * afterwards rather than refusing beforehand: blocking here means the form is
 * abandoned at 10pm and the job is never recorded at all.
 */
export const completeJob = (id: number) =>
  apiSend<ApiJobCompletion>('POST', `/jobs/${id}/complete`)
