import type {
  ApiContactKind,
  ApiContactLogEntry,
  ApiCustomer,
  ApiDormancySettings,
  ApiHouse,
  ApiInternetQuality,
} from '@/types/api'
import type { ContactHistoryEntry, HouseListItem } from '@/types/customerDetail'
import {
  CUSTOMER_FILTERS,
  phoneDigits,
  SOON_WITHIN_DAYS,
  type ContactKind,
  type CustomerFilterKey,
  type CustomerLogResult,
  type CustomerRecord,
  type CustomerRow,
  type CustomerStatus,
  type DormancyRule,
  type DuplicateMatch,
} from '@/types/customers'
import { formatMonthYear, formatShortDate } from '@/utils/format'

/**
 * Wire → view model for the customer list. Everything snake_case stops here.
 *
 * `GET /customers` answers with a record, not a row: it carries the status and
 * the dates, and nothing about the stage phrase, the countdown or the two risk
 * flags. Those are worked out below from the record plus the owner's own
 * dormancy threshold — once, so no component holds a threshold of its own.
 */

const MS_PER_DAY = 86_400_000

/** Whole days between an ISO date-time and now. Negative clamps to 0. */
function daysSince(iso: string, now = Date.now()): number {
  const elapsed = now - new Date(iso).getTime()
  return elapsed > 0 ? Math.floor(elapsed / MS_PER_DAY) : 0
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * MS_PER_DAY).toISOString()
}

export function toCustomerRecord(api: ApiCustomer): CustomerRecord {
  return {
    id: api.id,
    name: api.name,
    phone: api.phone,
    altPhone: api.alt_phone,
    email: api.email,
    status: api.status,
    storedStatus: api.stored_status,
    lastContactAt: api.last_contact_at,
    daysSinceLastContact: api.days_since_last_contact,
    notes: api.notes,
    anonymisedAt: api.anonymised_at,
    createdAt: api.created_at,
  }
}

/**
 * The wire has no `email`, so it goes as `other` — which means it comes back
 * indistinguishable from a real `other`. Drop the branch when the enum grows one.
 */
export const toApiContactKind = (kind: ContactKind): ApiContactKind =>
  kind === 'email' ? 'other' : kind

/** Whether an ISO date-time falls on the day being read. */
function isToday(iso: string, now = new Date()): boolean {
  const at = new Date(iso)
  return (
    at.getFullYear() === now.getFullYear() &&
    at.getMonth() === now.getMonth() &&
    at.getDate() === now.getDate()
  )
}

/**
 * One contact-log entry as block F's history renders it.
 *
 * The handoff draws three looks for an entry and the wire answers two of them:
 * an entry with a note, and one without. The third — a **status change** — has
 * no representation on this endpoint at all: nothing records that
 * `quoted → customer` happened on 14 Aug, or why. So a status change appears in
 * the history only when one is observed happening, which is what
 * `POST /customers/{id}/contact-logs` answers with; see `toLogResult`.
 *
 * `kind` (call / whatsapp / visit / quote_sent / other) is read and deliberately
 * not rendered: the handoff draws the note alone, and the channel is said on the
 * row that logged it. An entry logged today reads `today` rather than its date,
 * as the handoff's newest entry does.
 */
export function toContactHistoryEntry(api: ApiContactLogEntry): ContactHistoryEntry {
  const id = String(api.id)
  const date = isToday(api.occurred_at) ? 'today' : formatShortDate(api.occurred_at)
  const note = api.note?.trim() ?? ''

  return note ? { id, date, kind: 'note', text: note } : { id, date, kind: 'no-note' }
}

/**
 * What a house's internet says on the customer screen, if it says anything.
 *
 * Only the two that cost money get a chip. `reliable` is the absence of a
 * problem and `unknown` is a question for the house screen; neither earns a line
 * on a screen he is reading to decide who to call — the same reason the fault
 * line is omitted when nothing is faulty.
 */
const INTERNET_FLAG: Record<ApiInternetQuality, string | null> = {
  weak: 'internet weak',
  none: 'no internet',
  reliable: null,
  unknown: null,
}

/**
 * A house as her customer page lists it — **a name and one flag, and nothing
 * else**.
 *
 * This is where the screen's rule is enforced rather than merely observed: the
 * payload arrives carrying `address_text`, `landmark_directions`, `gps_lat`,
 * `gps_lng` and `access_notes`, and none of them are copied out. A component
 * cannot render what it was never handed, so "no address on this screen" holds
 * here once instead of in every template that touches a house.
 */
export function toHouseListItem(api: ApiHouse): HouseListItem {
  return {
    id: api.id,
    // A house with no name is still a house he has to be able to open.
    name: api.label?.trim() || 'Unnamed house',
    condition: INTERNET_FLAG[api.internet_quality],
  }
}

/**
 * The phrase beside her number — `last contact 8 d ago`.
 *
 * Formatting, not judgement: the figure is `days_since_last_contact`, which the
 * record carries, said the way `stagePhrase` says the same kind of thing. A
 * record nobody has spoken to has no elapsed time to report, only the fact.
 */
export function lastContactPhrase(record: CustomerRecord): string {
  if (record.lastContactAt === null) return 'no contact recorded'
  const days = record.daysSinceLastContact ?? daysSince(record.lastContactAt)
  return days === 0 ? 'last contact today' : `last contact ${days} d ago`
}

export function toDormancyRule(api: ApiDormancySettings): DormancyRule {
  return {
    dormantAfterDays: api.dormant_after_days,
    defaultDormantAfterDays: api.default_dormant_after_days,
  }
}

/**
 * Never contacted is not silence of zero but silence since the day she came in,
 * which is what floats an untouched enquiry to the top of a longest-quiet list.
 */
const quietDays = (record: CustomerRecord) =>
  record.daysSinceLastContact ?? daysSince(record.createdAt)

/**
 * The phrase under Stage. `quoted` carries no elapsed figure: there is no
 * quoted-at date on the row, and `last_contact_at` is a different date that the
 * Quiet for column already shows.
 */
function stagePhrase(record: CustomerRecord, rule: DormancyRule | null): string {
  switch (record.status) {
    case 'enquiry': {
      const days = daysSince(record.createdAt)
      return days === 0 ? 'first contact today' : `first contact ${days} d ago`
    }
    case 'quoted':
      return 'quoted'
    case 'customer':
      return `since ${formatMonthYear(record.createdAt)}`
    case 'dormant':
      // The day the calendar turned her dormant. Without either there is no
      // date to name, only the state.
      return rule && record.lastContactAt
        ? `dormant since ${formatShortDate(addDays(record.lastContactAt, rule.dormantAfterDays))}`
        : 'dormant'
  }
}

/**
 * `ever-quoted` is the one membership the wire cannot answer — neither `status`
 * nor `stored_status` holds a "has ever been quoted" fact. Everyone past the
 * enquiry stage over-counts only a customer who bought without being quoted.
 */
function filtersFor(status: CustomerStatus): CustomerFilterKey[] {
  const held: CustomerFilterKey[] = []
  if (status === 'quoted') held.push('quoted')
  if (status === 'enquiry') held.push('enquiries')
  if (status === 'customer') held.push('customers')
  if (status === 'dormant') held.push('dormant')
  if (status !== 'enquiry') held.push('ever-quoted')
  held.push('everyone')
  // The toolbar's order, not the order they were added.
  return CUSTOMER_FILTERS.filter((key) => held.includes(key))
}

/**
 * A record plus the rule, as the list renders it. `rule` is `null` when its own
 * request failed: the row keeps its name, number, status and quiet-for figure
 * and loses the countdown and the amber, which are the parts that need it.
 */
export function toCustomerRow(record: CustomerRecord, rule: DormancyRule | null): CustomerRow {
  const quietForDays = quietDays(record)

  // Only a quoted row counts down: an enquiry has no quote out, a customer has
  // bought, and a dormant one has arrived.
  const dormantInDays =
    rule && record.status === 'quoted'
      ? Math.max(0, rule.dormantAfterDays - quietForDays)
      : null

  return {
    id: record.id,
    name: record.name,
    phone: record.phone ?? '',
    status: record.status,
    stage: stagePhrase(record, rule),
    // Only a log sets a caption, and it arrives with the log's answer.
    statusCaption: null,
    quietForDays,
    dormantInDays,
    // Half the owner's threshold — the point where a quote has been out longer
    // than it has left. Derived, so moving the threshold moves the amber.
    warn: rule !== null && quietForDays >= rule.dormantAfterDays / 2,
    soon: dormantInDays !== null && dormantInDays <= SOON_WITHIN_DAYS,
    notes: record.notes,
    // TODO(api): D2's phone row is drawn as `024 551 8830 · house · 6 rooms`
    // and has never shown the second half. Rooms are `GET /houses/{id}/
    // composition` per house, so a list of 200 rows cannot ask. Wants room and
    // device counts on the houses payload; until then the row says nothing
    // rather than claiming she has no house.
    roomCount: undefined,
    filters: filtersFor(record.status),
  }
}

export const toCustomerRows = (
  records: readonly CustomerRecord[],
  rule: DormancyRule | null,
): CustomerRow[] => records.map((record) => toCustomerRow(record, rule))

/**
 * What a logged contact changed, or `null` for nothing worth re-rendering.
 * Dormancy is the only status a contact can move, being the only one derived
 * from `last_contact_at`, so there is one caption this can produce.
 */
export function toLogResult(
  before: CustomerStatus,
  after: CustomerRecord,
  rule: DormancyRule | null,
): CustomerLogResult | null {
  if (before !== 'dormant' || after.status === 'dormant') return null
  return {
    status: after.status,
    stage: `spoke today · ${stagePhrase(after, rule)}`,
    statusCaption: 'dormant cleared',
  }
}

export const toDuplicateMatch = (record: CustomerRecord): DuplicateMatch => ({
  id: record.id,
  name: record.name,
  phone: record.phone ?? '',
})

/** A shorter prefix would accuse half the list. */
const MIN_DUPLICATE_DIGITS = 6

/**
 * The check behind the duplicate notice, run over the list already in hand.
 *
 * Digits against digits, so the spacing he types is never the reason a
 * duplicate gets through — which the server's `q` could not manage, being a
 * substring over however the number happens to be stored. Both numbers count:
 * a second line is still the same person.
 */
export function findDuplicateIn(
  records: readonly CustomerRecord[],
  phone: string,
): DuplicateMatch | null {
  const digits = phoneDigits(phone)
  if (digits.length < MIN_DUPLICATE_DIGITS) return null

  const hit = records.find((record) =>
    [record.phone, record.altPhone].some(
      (candidate) => candidate !== null && phoneDigits(candidate).startsWith(digits),
    ),
  )
  return hit ? toDuplicateMatch(hit) : null
}

/**
 * TODO(api): what the customer screens still cannot say, and what each wants.
 * Kept beside the derivations so the two stay in step.
 *
 *   - **the latest contact note.** The list's Notes column shows her standing
 *     `notes`, which it already carries; what she last *said* is on
 *     `GET /customers/{id}/contact-logs` — one request per row. Wants it on the
 *     list payload.
 *   - **the quoted stage's elapsed figure.** `quoted` carries no "58 d ago"
 *     because the only true quoted-at date is the latest `kind=quote_sent`
 *     entry. Wants a `quoted_at` on the record.
 *   - **`ever-quoted` is approximated** as anyone past enquiry, there being no
 *     "has ever been quoted" fact on the wire. It over-counts a customer who
 *     bought without a quote.
 *   - **an `email` contact is written as `other`** and cannot be told from a
 *     real `other` coming back. Wants `email` in the `kind` enum; see
 *     `toApiContactKind`.
 *   - **a submitted contact cannot be taken back.** There is no delete for an
 *     entry, which is why the dialog's Cancel has to come before the write and
 *     why block F offers no Undo. Wants
 *     `DELETE /customers/{id}/contact-logs/{entryId}`.
 *   - **the duplicate check runs over the loaded list**, so it cannot see an
 *     archived or anonymised customer. Asking the server instead would cost a
 *     request per keystroke and still miss a number stored with other spacing.
 */
