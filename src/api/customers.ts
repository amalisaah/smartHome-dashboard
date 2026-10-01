import {
  CUSTOMER_FILTER_DEFS,
  CUSTOMER_ROWS,
  MOCK_LOAD_MS,
  findDuplicateByPhone,
} from '@/data/customersMock'
import type {
  CustomerDraft,
  CustomerFilterDef,
  CustomerLogResult,
  CustomerRow,
  DuplicateMatch,
} from '@/types/customers'

/**
 * The seam between the wire and the customer list.
 *
 * These answer from the mock rather than the API. `GET /customers` exists and
 * returns `status`, `stored_status`, `days_since_last_contact` and
 * `last_contact_at`, but not the stage phrase, the countdown, the warn/soon
 * flags, the latest note, the room count or the filter counts — and the handoff
 * is explicit that the screen renders those rather than works them out. Reading
 * the endpoint today would mean inventing five of the six columns here.
 *
 * Everything above this file is written against the real shape, so wiring it is
 * this file changing and nothing else.
 */

const settle = <T>(value: T, ms = MOCK_LOAD_MS): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms))

/** `GET /customers?sort=last_contact_desc`. */
export const fetchCustomers = (): Promise<CustomerRow[]> => settle([...CUSTOMER_ROWS])

/**
 * The six labels and counts. No endpoint yet: `?status=` takes one status at a
 * time, so `ever quoted · 13` would be three round trips or a client-side rule.
 * Separate because it should be — a counts failure costs the chips their
 * numbers, not the list its rows.
 */
export const fetchCustomerFilters = (): Promise<CustomerFilterDef[]> =>
  settle([...CUSTOMER_FILTER_DEFS])

/**
 * `POST /customers/{id}/contact` — the one-tap log. The endpoint answers with
 * `{ entry, customer }`, the customer already carrying its recalculated status,
 * which is what state 4 renders. Nothing on screen waits for it.
 */
export const logContact = (customerId: number): Promise<CustomerLogResult | null> => {
  const row = CUSTOMER_ROWS.find((candidate) => candidate.id === customerId)
  return settle(row?.afterLog ?? null, 260)
}

/** `POST /customers`. The id is minted by the save, not by the click. */
export const createCustomer = (_draft: CustomerDraft): Promise<{ id: number }> =>
  settle({ id: Math.max(...CUSTOMER_ROWS.map((row) => row.id)) + 1 }, 200)

/** `GET /customers?q=<phone>` — the check behind the duplicate notice. */
export const findDuplicate = (phone: string): Promise<DuplicateMatch | null> =>
  settle(findDuplicateByPhone(phone), 120)
