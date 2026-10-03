import type { ApiContactKind, ApiCustomer, ApiDormancySettings } from '@/types/api'
import {
  CUSTOMER_FILTERS,
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
    status: api.status,
    storedStatus: api.stored_status,
    lastContactAt: api.last_contact_at,
    daysSinceLastContact: api.days_since_last_contact,
    createdAt: api.created_at,
  }
}

/**
 * The wire has no `email`, so it goes as `other` — which means it comes back
 * indistinguishable from a real `other`. Drop the branch when the enum grows one.
 */
export const toApiContactKind = (kind: ContactKind): ApiContactKind =>
  kind === 'email' ? 'other' : kind

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
    lastSaid: null,
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

/**
 * What the API still cannot answer, kept beside the derivations so the two stay
 * in step. The first three are each one request per row:
 *
 *   - `lastSaid` — on `GET /customers/{id}/contact-logs`. Rendered `—`, except
 *     on a row logged this session, which shows the note he just typed.
 *   - `roomCount` — `GET /customers/{id}/houses` then `/houses/{id}/composition`
 *     per house, summed. Left `undefined`; the phone row says nothing rather
 *     than claiming she has no house.
 *   - the quoted stage's elapsed figure — needs the latest `kind=quote_sent`
 *     entry, the only true quoted-at date.
 *   - `email` is not a `kind`, so it is written as `other` and cannot be read
 *     back as email. Wants `email` in the enum; see `toApiContactKind`.
 *   - a submitted entry cannot be taken back — there is no delete for one, so
 *     the dialog's Cancel is the only way out and it has to come before the
 *     write. Wants `DELETE /customers/{id}/contact-logs/{entryId}`.
 *   - the duplicate check — `?q=` is a substring over stored text, so a number
 *     typed with different spacing is never returned to compare against.
 */
