import type {
  ApiContactLogEntry,
  ApiContactResult,
  ApiCustomer,
  ApiCustomerCreate,
  ApiDormancySettings,
} from '@/types/api'
import type { ContactHistoryEntry } from '@/types/customerDetail'
import {
  type ContactLogDraft,
  type CustomerDraft,
  type CustomerLogResult,
  type CustomerRecord,
  type CustomerStatus,
  type DormancyRule,
} from '@/types/customers'
import {
  toApiContactKind,
  toContactHistoryEntry,
  toCustomerRecord,
  toDormancyRule,
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
 * `GET /customers/{id}/contact-logs` — her contact history, as block F's detail
 * screen reads it.
 *
 * Most recent first, in the order the endpoint gives: the screen renders the
 * sequence it is handed and never re-sorts it. Its own request, so a history
 * that cannot be read costs the history and not her record.
 */
export async function fetchContactLogs(
  id: number,
  signal?: AbortSignal,
): Promise<ContactHistoryEntry[]> {
  const entries = await apiGet<ApiContactLogEntry[]>(
    `/customers/${id}/contact-logs`,
    undefined,
    signal,
  )
  return entries.map(toContactHistoryEntry)
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
