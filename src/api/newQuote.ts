/**
 * What block G reads, and the one thing it writes.
 *
 * **Two list reads for the whole picker, and they are reads the screen
 * underneath has already made.** `GET /customers` gives the customers in
 * recent-contact order, which is the order step 1 renders and never re-sorts;
 * `GET /houses` gives every house across every customer in one request, which
 * is what lets a customer row say `3 houses` without a request per row.
 *
 * **Room counts are not in either payload** (gap report: `GET /houses` carries
 * no `room_count`, and `/houses/{id}/composition` is per house). So they are
 * read on the tap, for the one customer he picked, and cached against her — a
 * handful of parallel requests at the moment they first mean something, rather
 * than one per house in the business every time the picker opens. If a
 * `room_count` ever lands on the houses payload, this call stops being made and
 * nothing above it changes.
 */

import type { ApiCustomer, ApiHouse, ApiRoom } from '@/types/api'
import type { ApiQuoteRecord } from '@/types/quoteApi'
import type { NewQuoteCustomer, NewQuoteHouse } from '@/types/newQuote'
import { apiGet, apiSend } from './http'

/**
 * Dormant customers are in: a customer who has gone quiet is exactly who is
 * standing there when a quote starts, and hiding her would mean searching for
 * somebody the app is sure does not need quoting. Archived and anonymised are
 * out, at the endpoint's own defaults — a removed record is not someone to
 * start new work against.
 */
const QUOTABLE_CUSTOMERS = { include_dormant: 'true', sort: 'last_contact_desc' }

/**
 * Every customer who could be quoted, with her houses already on her.
 *
 * Fired together, so the picker waits for the slower of the two rather than for
 * the sum. The customers' order is the answer's order and is not touched here.
 */
export async function fetchQuoteStarters(signal?: AbortSignal): Promise<NewQuoteCustomer[]> {
  const [customers, houses] = await Promise.all([
    apiGet<ApiCustomer[]>('/customers', QUOTABLE_CUSTOMERS, signal),
    apiGet<ApiHouse[]>('/houses', undefined, signal),
  ])

  const housesByCustomer = new Map<number, NewQuoteHouse[]>()
  for (const house of houses) {
    const forCustomer = housesByCustomer.get(house.customer_id) ?? []
    forCustomer.push({
      id: house.id,
      // A house with no name is still a house he has to be able to pick.
      area: house.label?.trim() || 'Unnamed house',
      roomCount: null,
    })
    housesByCustomer.set(house.customer_id, forCustomer)
  }

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    houses: housesByCustomer.get(customer.id) ?? [],
  }))
}

/**
 * How many rooms each of these houses has, keyed by house id.
 *
 * One request per house, in parallel — which is the shape of the endpoint, not
 * a choice. A house whose rooms cannot be read counts as **0** rather than as
 * unknown: the row then says `no rooms yet · can't quote` and offers the way to
 * add them, which is the safe reading. Starting a quote against a house we
 * could not vouch for is the one outcome worth refusing.
 */
export async function fetchRoomCounts(
  houseIds: number[],
  signal?: AbortSignal,
): Promise<Map<number, number>> {
  const counts = await Promise.all(
    houseIds.map(async (id) => {
      try {
        const rooms = await apiGet<ApiRoom[]>(`/houses/${id}/rooms`, undefined, signal)
        return [id, rooms.length] as const
      } catch {
        return [id, 0] as const
      }
    }),
  )
  return new Map(counts)
}

/**
 * `POST /quotes` — the draft, and the only write this block makes.
 *
 * `level_label` is left off so the endpoint applies its own default, `custom`.
 * The level step is not in this handoff and sending `custom` by hand would be
 * this screen claiming to have asked a question it never put.
 *
 * The answer carries the quote's rooms, so the builder opens on the first room
 * with nothing further to read.
 */
export async function createQuote(customerId: number, houseId: number): Promise<{ id: number }> {
  const created = await apiSend<ApiQuoteRecord>('POST', '/quotes', {
    customer_id: customerId,
    house_id: houseId,
  })
  return { id: created.id }
}
