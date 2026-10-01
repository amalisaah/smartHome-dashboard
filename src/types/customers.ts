/**
 * Module 5, block D — the customer list.
 *
 * Every judgement is made upstream: status, stage phrase, quiet-for days, the
 * dormancy countdown, the warn/soon flags, filter membership and counts all
 * arrive on the row and are rendered as given. There is no threshold in this
 * module — the reference's 30-day amber and 10-day countdown are mock values,
 * and the UI reads the flags instead of comparing against either.
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

export interface CustomerRow {
  id: number
  name: string
  phone: string
  status: CustomerStatus
  /** `quoted 58 d ago`, `since Aug 2026`, `dormant since 3 Sep`. */
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
  /** `null` renders as `—`. */
  lastSaid: string | null
  /** Phone only. `null` is "no house yet" — never an address, at any viewport. */
  roomCount: number | null
  /** Which filters hold this row. Not a rule the UI knows. */
  filters: CustomerFilterKey[]
  /** What logging would return here. `null` = status unchanged. */
  afterLog: CustomerLogResult | null
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
