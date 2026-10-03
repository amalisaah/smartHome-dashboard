/**
 * Module 5, block D — the customer list.
 *
 * Two shapes, deliberately apart. `CustomerRecord` is a customer as the API
 * records one; `CustomerRow` is what the list renders. The second is worked out
 * from the first plus the dormancy rule in `@/utils/mapper/customerMapper`, so
 * every component renders its row as given and holds no threshold of its own.
 */

/** Fixed vocabulary. These four words, in these spellings. */
export type CustomerStatus = 'enquiry' | 'quoted' | 'customer' | 'dormant'

/** D1's six filters, in the order the toolbar draws them. */
export const CUSTOMER_FILTERS = [
  'quoted',
  'enquiries',
  'customers',
  'dormant',
  'ever-quoted',
  'everyone',
] as const

export type CustomerFilterKey = (typeof CUSTOMER_FILTERS)[number]

/** The four D2 draws, in its own order. */
export const PHONE_FILTERS = ['everyone', 'enquiries', 'quoted', 'customers'] as const

export const DEFAULT_FILTER: CustomerFilterKey = 'quoted'
export const DEFAULT_PHONE_FILTER: CustomerFilterKey = 'everyone'

/** The two columns that are orderings. The other four are not. */
export type CustomerSortColumn = 'name' | 'quiet'
export type SortDirection = 'asc' | 'desc'

export interface CustomerSort {
  column: CustomerSortColumn
  direction: SortDirection
}

/**
 * What the data layer answers with after a contact is logged. A dormant
 * customer is no longer dormant once someone has spoken to her; when that
 * happens the row renders this. The UI never decides it.
 */
export interface CustomerLogResult {
  status: CustomerStatus
  stage: string
  /** The caption under the new chip — `dormant cleared`. */
  statusCaption: string
}

/** A customer as the API records one — camelCase, and no judgement applied. */
export interface CustomerRecord {
  id: number
  name: string
  /** Null for a record taken down without one. */
  phone: string | null
  altPhone: string | null
  /** Effective status — `dormant` is evaluated live against the threshold. */
  status: CustomerStatus
  storedStatus: CustomerStatus
  /** ISO date-time of the latest contact-log entry; null when never contacted. */
  lastContactAt: string | null
  /** Null when never contacted — the row counts from `createdAt` instead. */
  daysSinceLastContact: number | null
  /** Her standing notes — what to remember about her, not what she last said. */
  notes: string | null
  createdAt: string
}

/**
 * `GET /settings/dormancy`. A quoted customer quiet for longer than this reads
 * as dormant. A setting, not a constant — the owner will change it.
 */
export interface DormancyRule {
  dormantAfterDays: number
  defaultDormantAfterDays: number
}

/**
 * How close to dormant the countdown gets before it reads as risk. The one
 * figure here from the drawing rather than the server.
 */
export const SOON_WITHIN_DAYS = 10

export interface CustomerRow {
  id: number
  name: string
  /** Empty for a record with no number; the row renders what it has. */
  phone: string
  status: CustomerStatus
  /** `quoted`, `first contact 5 d ago`, `since Aug 2026`, `dormant since 3 Sep`. */
  stage: string
  statusCaption: string | null
  /** Whole days of silence, rendered as `52 d`. */
  quietForDays: number
  /** `null` when no countdown applies to this row. */
  dormantInDays: number | null
  /** The quiet-for figure reads as risk, at weight 600. */
  warn: boolean
  /** The countdown chip reads as risk. */
  soon: boolean
  /**
   * Her standing notes, as the Notes column. Not the latest contact note —
   * that is one request per row; see the gap note in the mapper.
   */
  notes: string | null
  /**
   * Phone only. `null` is "no house yet"; `undefined` is "we did not ask",
   * which is the case today — never an address, at any viewport.
   */
  roomCount?: number | null
  /** Which filters hold this row. Not a rule the UI knows. */
  filters: CustomerFilterKey[]
}

export interface CustomerFilterDef {
  key: CustomerFilterKey
  /** D1's label; the chip appends the count: `to chase — quoted · 7`. */
  label: string
  /** D2's label for the same membership — the phone says `quoted`. */
  phoneLabel: string
  /** `null` is "not counted yet": labels go up with the frame, counts follow. */
  count: number | null
  defaultSort: CustomerSort
}

/**
 * How he reached her, in the order the dialog draws them — the three channels,
 * then the one that is an errand rather than a channel.
 *
 * All but `email` are the wire's own words. The endpoint's `kind` enum has no
 * email, so it is sent as `other` and cannot be told from a real `other` on the
 * way back; delete that mapping when the enum carries `email`.
 */
export const CONTACT_KINDS = ['call', 'email', 'whatsapp', 'quote_sent'] as const

export type ContactKind = (typeof CONTACT_KINDS)[number]

/** What the select offers and what the logged row reads back. */
export const CONTACT_KIND_LABEL: Record<ContactKind, string> = {
  call: 'Call',
  email: 'Email',
  whatsapp: 'WhatsApp',
  quote_sent: 'Quote sent',
}

export const CONTACT_KIND_OPTIONS: { label: string; value: ContactKind }[] = CONTACT_KINDS.map(
  (value) => ({ label: CONTACT_KIND_LABEL[value], value }),
)

/** What the dialog collects. A call with nothing said is still a contact. */
export interface ContactLogDraft {
  kind: ContactKind
  note: string
}

export const blankContactLogDraft = (): ContactLogDraft => ({ kind: 'call', note: '' })

/**
 * A contact logged in this session. It lives in the screen, not on the row: the
 * entry was written when he submitted the dialog, and this is what the row
 * shows about it until he leaves the view.
 */
export interface LoggedContact {
  /** `14:02` — stamped when the entry was written. */
  time: string
  kind: ContactKind
  result: CustomerLogResult | null
}

export interface CustomerDraft {
  name: string
  phone: string
  asked: string
}

/** Reported against the typed phone. A notice, never a block. */
export interface DuplicateMatch {
  id: number
  name: string
  phone: string
}

export const blankCustomerDraft = (name = ''): CustomerDraft => ({ name, phone: '', asked: '' })

/** Name and phone carry a record; what she asked about is a nicety. */
export const isDraftSaveable = (draft: CustomerDraft) =>
  draft.name.trim() !== '' && draft.phone.trim() !== ''

/**
 * The status chip's look. `dormant` is dashed because the calendar set it, and
 * dashed on this screen means system-set, never a control.
 */
export const STATUS_BADGE: Record<
  CustomerStatus,
  'category-outlined' | 'quoted' | 'customer' | 'dormant'
> = {
  enquiry: 'category-outlined',
  quoted: 'quoted',
  customer: 'customer',
  dormant: 'dormant',
}

/** Digits only, so `024 551 8830` is found by `0245518830` or `5518`. */
export const phoneDigits = (phone: string) => phone.replace(/\D/g, '')

export const isCustomerFilterKey = (raw: unknown): CustomerFilterKey | null =>
  typeof raw === 'string' && (CUSTOMER_FILTERS as readonly string[]).includes(raw)
    ? (raw as CustomerFilterKey)
    : null

// --- filter copy ------------------------------------------------------------

const FILTER_COPY: Record<
  CustomerFilterKey,
  Pick<CustomerFilterDef, 'label' | 'phoneLabel' | 'defaultSort'>
> = {
  // The working views open on the longest silence; the rest are lists to look
  // someone up in, so they open by name.
  quoted: {
    label: 'to chase — quoted',
    phoneLabel: 'quoted',
    defaultSort: { column: 'quiet', direction: 'desc' },
  },
  enquiries: {
    label: 'enquiries',
    phoneLabel: 'enquiries',
    defaultSort: { column: 'quiet', direction: 'desc' },
  },
  customers: {
    label: 'customers',
    phoneLabel: 'customers',
    defaultSort: { column: 'name', direction: 'asc' },
  },
  dormant: {
    label: 'dormant',
    phoneLabel: 'dormant',
    defaultSort: { column: 'name', direction: 'asc' },
  },
  'ever-quoted': {
    label: 'ever quoted',
    phoneLabel: 'ever quoted',
    defaultSort: { column: 'name', direction: 'asc' },
  },
  everyone: {
    label: 'everyone',
    phoneLabel: 'everyone',
    defaultSort: { column: 'name', direction: 'asc' },
  },
}

/** Labels with nothing counted: the chips go up on first paint, before the rows. */
export const CUSTOMER_FILTER_COPY: readonly CustomerFilterDef[] = CUSTOMER_FILTERS.map((key) => ({
  key,
  ...FILTER_COPY[key],
  count: null,
}))

/** The same six, carrying counts. `rows` is the whole list, not the filtered one. */
export const customerFilterDefs = (rows: readonly CustomerRow[]): CustomerFilterDef[] =>
  CUSTOMER_FILTERS.map((key) => ({
    key,
    ...FILTER_COPY[key],
    count: rows.filter((row) => row.filters.includes(key)).length,
  }))

/**
 * The footer's explainer. Until the rule lands the sentence names no figure
 * rather than a stale one.
 */
export const dormancyExplainer = (rule: DormancyRule | null) =>
  rule === null
    ? 'Dormant is set by the calendar, never by hand'
    : `Dormant is set by the calendar, never by hand — ${rule.dormantAfterDays} quiet days after a quote`
