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
  /** Effective status — `dormant` is evaluated live against the threshold. */
  status: CustomerStatus
  storedStatus: CustomerStatus
  /** ISO date-time of the latest contact-log entry; null when never contacted. */
  lastContactAt: string | null
  /** Null when never contacted — the row counts from `createdAt` instead. */
  daysSinceLastContact: number | null
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
  /** `null` renders as `—`, and is all the API can answer today. */
  lastSaid: string | null
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
 * A contact logged in this session. It lives in the screen, not on the row: the
 * record was written on the click, and this is what the row shows about it
 * until he leaves the view.
 */
export interface LoggedContact {
  /** `14:02` — stamped on the click, not on the note closing. */
  time: string
  /** Empty means he never typed one, which renders as `Spoke — no note`. */
  note: string
  noteOpen: boolean
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
