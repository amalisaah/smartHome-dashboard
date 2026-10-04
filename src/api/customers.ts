import type {
  ApiContactLogEntry,
  ApiContactResult,
  ApiCustomer,
  ApiCustomerCreate,
  ApiCustomerUpdate,
  ApiDormancySettings,
  ApiHouse,
  ApiHouseCreate,
} from '@/types/api'
import { parseGps, type HouseDraft } from '@/types/house'
import type { ContactHistoryEntry, HouseListItem } from '@/types/customerDetail'
import {
  type ContactLogDraft,
  type CustomerDraft,
  type CustomerEditDraft,
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
  toHouseListItem,
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
 * `GET /customers/{id}/houses` — her houses, in one request.
 *
 * One request is the whole constraint, and it decides what the list can say. The
 * houses payload carries no room, device or fault counts: those are
 * `GET /houses/{id}/composition` and `GET /houses/{id}/installed-devices`, one
 * call each **per house**, which is where the N+1 would start. So the list shows
 * what a house is called and the one condition the payload states outright.
 *
 * Archived houses are left out: the `archived` flag is not sent, which is the
 * endpoint's own default.
 */
export async function fetchHouses(id: number, signal?: AbortSignal): Promise<HouseListItem[]> {
  const houses = await apiGet<ApiHouse[]>(`/customers/${id}/houses`, undefined, signal)
  return houses.map(toHouseListItem)
}

/**
 * One house of hers, with everything the list drops.
 *
 * There is no `GET /houses/{id}`: the only endpoint that answers with an
 * `ApiHouse` is the plural one, so the house is picked out of her list. That is
 * one request either way, and it shares its cache with her customer page.
 *
 * `null` for a house id that is not hers (or is archived, which the endpoint
 * leaves out) — the screen says so rather than rendering an empty form that
 * would look like a house nobody has visited yet.
 */
export async function fetchHouse(
  customerId: number,
  houseId: number,
  signal?: AbortSignal,
): Promise<ApiHouse | null> {
  const houses = await apiGet<ApiHouse[]>(`/customers/${customerId}/houses`, undefined, signal)
  return houses.find((house) => house.id === houseId) ?? null
}

/**
 * `POST /customers/{id}/houses` — the house the form just started.
 *
 * Blanks go as `null` rather than as `""`, as everywhere else on this module:
 * an address nobody wrote down is not an empty address. The GPS pair is sent
 * only when both halves parsed, because half a coordinate is not a position.
 */
export async function createHouse(
  customerId: number,
  draft: HouseDraft,
): Promise<{ id: number }> {
  const text = (value: string) => value.trim() || null
  const gps = parseGps(draft.gps)

  const body: ApiHouseCreate = {
    label: text(draft.label),
    address_text: text(draft.addressText),
    landmark_directions: text(draft.landmarkDirections),
    gps_lat: gps === null || gps === 'invalid' ? null : gps.lat,
    gps_lng: gps === null || gps === 'invalid' ? null : gps.lng,
    access_notes: text(draft.accessNotes),
    wiring_notes: text(draft.wiringNotes),
    internet_quality: draft.internetQuality,
    internet_notes: text(draft.internetNotes),
    notes: text(draft.notes),
  }

  const created = await apiSend<ApiHouse>('POST', `/customers/${customerId}/houses`, body)
  return { id: created.id }
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
 * `PATCH /customers/{id}` — what block F's screens may change about her.
 *
 * **Only the fields passed are sent.** The endpoint leaves an omitted field
 * untouched, so the dialog sends all four and the notes field on the page sends
 * only `notes` — which is what stops a note saved while a rename is in flight
 * from writing the old name back over it.
 *
 * An emptied value goes as an explicit `null` rather than as `""`: the wire's
 * own distinction between a blank string and nothing at all, and the way a
 * number taken down wrongly is taken off.
 *
 * The endpoint rejects an anonymised customer. The screen offers neither door in
 * that state, so a 400 here means the record was anonymised elsewhere while the
 * form was open — which is why the dialog holds what he typed.
 */
export async function updateCustomer(
  id: number,
  fields: Partial<CustomerEditDraft>,
): Promise<CustomerRecord> {
  const body: ApiCustomerUpdate = {}
  // A name is never cleared; the other three are, and `null` is how.
  if (fields.name !== undefined) body.name = fields.name.trim()
  if (fields.phone !== undefined) body.phone = fields.phone.trim() || null
  if (fields.email !== undefined) body.email = fields.email.trim() || null
  if (fields.notes !== undefined) body.notes = fields.notes.trim() || null

  return toCustomerRecord(await apiSend<ApiCustomer>('PATCH', `/customers/${id}`, body))
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
