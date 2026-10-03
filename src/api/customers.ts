import type {
  ApiContactResult,
  ApiCustomer,
  ApiCustomerCreate,
  ApiDormancySettings,
} from '@/types/api'
import {
  phoneDigits,
  type ContactLogDraft,
  type CustomerDraft,
  type CustomerLogResult,
  type CustomerRecord,
  type CustomerStatus,
  type DormancyRule,
  type DuplicateMatch,
} from '@/types/customers'
import {
  toApiContactKind,
  toCustomerRecord,
  toDormancyRule,
  toDuplicateMatch,
  toLogResult,
} from '@/utils/mapper/customerMapper'
import { apiGet, apiSend } from './http'

/**
 * The seam between the wire and the customer list.
 *
 * What comes back is a `CustomerRecord`. The screen's row is that record read
 * against the dormancy rule, which is a separate request with a separate fate,
 * so the two are combined at the view rather than welded together here.
 */

/** A shorter prefix would accuse half the list. */
const MIN_DUPLICATE_DIGITS = 6

/**
 * `GET /customers`. Unpaginated, so the list is fetched once and worked over in
 * memory — that is what lets a keystroke re-filter without a round trip.
 * `include_dormant` because four of the six chips need those rows.
 */
export async function fetchCustomers(signal?: AbortSignal): Promise<CustomerRecord[]> {
  const rows = await apiGet<ApiCustomer[]>(
    '/customers',
    { include_dormant: 'true', sort: 'last_contact_desc' },
    signal,
  )
  return rows.map(toCustomerRecord)
}

/** `GET /customers/{id}`. */
export async function fetchCustomer(id: number, signal?: AbortSignal): Promise<CustomerRecord> {
  return toCustomerRecord(await apiGet<ApiCustomer>(`/customers/${id}`, undefined, signal))
}

/**
 * `GET /settings/dormancy`. Its own request, so a screen that cannot read the
 * rule still lists every customer; it just stops judging them.
 */
export async function fetchDormancyRule(signal?: AbortSignal): Promise<DormancyRule> {
  return toDormancyRule(
    await apiGet<ApiDormancySettings>('/settings/dormancy', undefined, signal),
  )
}

/**
 * `POST /customers/{id}/contact-logs` — the entry the dialog collects. Writing
 * it recomputes `last_contact_at`, which is what clears a dormancy.
 *
 * `before` is the status the row was showing: the answer says what she is now,
 * and only the caller knows what she was. Nothing is written until he submits,
 * so cancelling the dialog leaves no trace — there is no delete for an entry.
 */
export async function addContactLog(
  customerId: number,
  draft: ContactLogDraft,
  before: CustomerStatus,
  rule: DormancyRule | null,
): Promise<CustomerLogResult | null> {
  const { customer } = await apiSend<ApiContactResult>(
    'POST',
    `/customers/${customerId}/contact-logs`,
    { kind: toApiContactKind(draft.kind), note: draft.note.trim() || null },
  )
  return toLogResult(before, toCustomerRecord(customer), rule)
}

/**
 * `POST /customers`. The id is minted by the save. What she asked about goes to
 * `notes` — `source` is how she was found, a different question the form does
 * not put.
 */
export async function createCustomer(draft: CustomerDraft): Promise<{ id: number }> {
  const body: ApiCustomerCreate = {
    name: draft.name.trim(),
    phone: draft.phone.trim() || null,
    status: 'enquiry',
    notes: draft.asked.trim() || null,
  }
  const created = await apiSend<ApiCustomer>('POST', '/customers', body)
  return { id: created.id }
}

/**
 * `GET /customers?q=` — the check behind the duplicate notice. The server's `q`
 * is a substring over stored text, so it gets the number as typed and the
 * digits-only comparison happens here; a number written differently from the
 * way it was stored still slips past, as the mapper's gap note records.
 */
export async function findDuplicate(
  phone: string,
  signal?: AbortSignal,
): Promise<DuplicateMatch | null> {
  const typed = phone.trim()
  const digits = phoneDigits(typed)
  if (digits.length < MIN_DUPLICATE_DIGITS) return null

  const rows = await apiGet<ApiCustomer[]>(
    '/customers',
    { q: typed, include_dormant: 'true' },
    signal,
  )
  const hit = rows
    .map(toCustomerRecord)
    .find((record) => record.phone !== null && phoneDigits(record.phone).startsWith(digits))

  return hit ? toDuplicateMatch(hit) : null
}
