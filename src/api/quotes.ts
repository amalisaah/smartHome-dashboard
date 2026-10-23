/**
 * The seam between the quote endpoints and the screen. Each fetcher maps its
 * answer through `@/utils/mapper/quoteMapper`, so no component sees a
 * `_pesewas` key.
 *
 * The two reads at the top are the cost wall. `fetchOwnerView` and
 * `fetchCustomerView` call different endpoints returning different shapes, and
 * the customer one is built server-side by a serializer with no cost field on
 * its input type. Her view is never his view filtered: it is a second request,
 * and that is the point — a mistake in this file cannot put a cost on her
 * screen, because there is no cost in what comes back.
 */

import type { CustomerQuote, QuoteHeader, QuoteOwnerView, QuoteRoom } from '@/types/quote'
import type {
  ApiQuoteAccept,
  ApiQuoteAccepted,
  ApiQuoteCustomerView,
  ApiQuoteDecline,
  ApiQuoteLine,
  ApiQuoteLineCreate,
  ApiQuoteOwnerView,
  ApiQuoteRoom,
} from '@/types/quoteApi'
import {
  toChargesPatch,
  toCustomerQuote,
  toLineBulkPatch,
  toQuoteOwnerView,
  toQuoteRoom,
} from '@/utils/mapper/quoteMapper'
import { apiGet, apiSend } from './http'

/**
 * `GET /quotes` — enough of each quote to name it and open it.
 *
 * The list screen is block A's neighbour and not in this handoff; this exists so
 * the stub standing in for it can offer a real quote rather than a guessed id.
 */
export async function fetchQuotes(signal?: AbortSignal): Promise<QuoteHeader[]> {
  const rows = await apiGet<ApiQuoteOwnerView[]>('/quotes', undefined, signal)
  return rows.map((row) => toQuoteOwnerView({ ...row, money: EMPTY_MONEY, lines: [] }).header)
}

/**
 * `GET /quotes` answers quote records without the `money` block the owner view
 * carries, and the header mapper does not read it. Zeroes rather than a second
 * mapper for a shape only the stub uses.
 */
const EMPTY_MONEY = {
  device_total_pesewas: 0,
  labour_charge_pesewas: 0,
  labour_charge_is_derived: true,
  materials_charge_pesewas: 0,
  materials_charge_is_derived: true,
  room_count: 0,
  proposed_total_pesewas: 0,
  misc_cost_estimate_pesewas: 0,
  cost_total_pesewas: 0,
  expected_profit_pesewas: 0,
  measured_against_pesewas: 0,
}

/** `GET /quotes/{id}/owner-view` — lines, totals and expected profit. */
export async function fetchQuoteOwnerView(
  quoteId: number,
  signal?: AbortSignal,
): Promise<QuoteOwnerView> {
  const view = await apiGet<ApiQuoteOwnerView>(`/quotes/${quoteId}/owner-view`, undefined, signal)
  return toQuoteOwnerView(view)
}

/**
 * `GET /quotes/{id}/customer-view` — her quote, grouped by need.
 *
 * `facts` carries the three things her screen shows that this endpoint does not:
 * the date, the surname and the room count. The caller reads them from the
 * quote, the customer record and the house's rooms — all customer-safe.
 */
export async function fetchQuoteCustomerView(
  quoteId: number,
  itemised: boolean,
  facts: { createdAt: string; surname: string; roomCount: number },
  signal?: AbortSignal,
): Promise<CustomerQuote> {
  const view = await apiGet<ApiQuoteCustomerView>(
    `/quotes/${quoteId}/customer-view`,
    { itemised: itemised ? 'true' : undefined },
    signal,
  )
  return toCustomerQuote(view, facts)
}

/** `GET /quotes/{id}/rooms` — the rooms of this quote's house, in walk order. */
export async function fetchQuoteRooms(
  quoteId: number,
  signal?: AbortSignal,
): Promise<QuoteRoom[]> {
  const rooms = await apiGet<ApiQuoteRoom[]>(`/quotes/${quoteId}/rooms`, undefined, signal)
  return rooms.map(toQuoteRoom)
}

// --- writes -----------------------------------------------------------------

/**
 * `POST /quotes/{id}/lines`. `need` is left out so the server takes the
 * catalogue item's group, which keeps adding to one tap in a living room.
 */
export const addQuoteLine = (quoteId: number, line: ApiQuoteLineCreate) =>
  apiSend<ApiQuoteLine>('POST', `/quotes/${quoteId}/lines`, line)

/**
 * `POST /quotes/{id}/lines/bulk` — every line he added to one room, in a single
 * transaction and a single request.
 *
 * This is what submitting uses instead of a POST per line. Four items added to
 * a living room is one round trip, not four, which on a phone is the difference
 * between one radio wake-up and four.
 */
export const addQuoteLines = (
  quoteId: number,
  roomId: number | null,
  lines: Omit<ApiQuoteLineCreate, 'room_id'>[],
) => apiSend<ApiQuoteLine[]>('POST', `/quotes/${quoteId}/lines/bulk`, { room_id: roomId, lines })

/**
 * `PATCH /quotes/{id}/lines/bulk` — every line he changed, in a single
 * transaction and a single request. `is_removed` carries the switch-offs and
 * switch-backs-on, so a negotiation is one call rather than one per line.
 *
 * It answers with the quote and its new totals, which is why this is what
 * submitting uses: there is no follow-up `GET /owner-view` behind it.
 */
export const updateQuoteLines = async (
  quoteId: number,
  edits: { lineId: number; fields: Parameters<typeof toLineBulkPatch>[1] }[],
): Promise<QuoteOwnerView> => {
  const view = await apiSend<ApiQuoteOwnerView>('PATCH', `/quotes/${quoteId}/lines/bulk`, {
    lines: edits.map((edit) => toLineBulkPatch(edit.lineId, edit.fields)),
  })
  return toQuoteOwnerView(view)
}

/**
 * `PATCH /quotes/{id}/charges` — labour, materials and the misc estimate. It
 * answers with the quote and its new totals, as the bulk line patch does.
 */
export const updateQuoteCharges = async (
  quoteId: number,
  fields: Parameters<typeof toChargesPatch>[0],
): Promise<QuoteOwnerView> => {
  const view = await apiSend<ApiQuoteOwnerView>(
    'PATCH',
    `/quotes/${quoteId}/charges`,
    toChargesPatch(fields),
  )
  return toQuoteOwnerView(view)
}

// --- her answer -------------------------------------------------------------

/** The accepted quote, and the job the acceptance created in the same breath. */
export interface AcceptedQuote {
  view: QuoteOwnerView
  jobId: number
}

/**
 * `POST /quotes/{id}/accept` — what she agreed to, and the job it creates.
 *
 * One request for both, because the API does both in one transaction: there is
 * no window where the quote is accepted and the deposit has nowhere to land.
 * The figure is always sent, never defaulted — see `ApiQuoteAccept`.
 */
export const acceptQuote = async (
  quoteId: number,
  agreedTotalPesewas: number,
): Promise<AcceptedQuote> => {
  const body: ApiQuoteAccept = { agreed_total_pesewas: agreedTotalPesewas }
  const answer = await apiSend<ApiQuoteAccepted>('POST', `/quotes/${quoteId}/accept`, body)
  return { view: toQuoteOwnerView(answer), jobId: answer.job_id }
}

/**
 * `POST /quotes/{id}/decline`. The reason is optional and usually absent; an
 * empty box is sent as `null` rather than as `""`, because he left it blank
 * and a blank string would read back as a reason he recorded.
 */
export const declineQuote = async (
  quoteId: number,
  reason: string | null,
): Promise<QuoteOwnerView> => {
  const body: ApiQuoteDecline = { declined_reason: reason?.trim() || null }
  const view = await apiSend<ApiQuoteOwnerView>('POST', `/quotes/${quoteId}/decline`, body)
  return toQuoteOwnerView(view)
}
