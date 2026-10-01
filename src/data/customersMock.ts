import {
  CUSTOMER_FILTERS,
  type CustomerFilterDef,
  type CustomerFilterKey,
  type CustomerRow,
  type DuplicateMatch,
} from '@/types/customers'

/**
 * Local stand-in for the customer list, shaped as the screen needs it rather
 * than as `GET /customers` answers — the endpoint does not return most of it
 * yet. The gaps are listed at the foot of this file.
 *
 * Every value is written out rather than worked out. A quoted row's quiet-for
 * and its countdown add to 60 because the mock is careful, not because anything
 * downstream adds them; likewise nothing compares a figure against 30 or 10.
 *
 * Rows are in D2's order — most recent contact first, which is what
 * `GET /customers?sort=last_contact_desc` returns. D1 re-sorts by its own column.
 */

/** Simulated first load, so the handoff's skeleton rows are real. */
export const MOCK_LOAD_MS = 320

/**
 * The footer's explainer, verbatim from the reference. It names 60 days in a
 * sentence — copy, not a constant anything computes with. The real threshold is
 * `GET /settings/dormancy`, which is where this string's number comes from once
 * it is wired.
 */
export const DORMANCY_EXPLAINER =
  'Dormant is set by the calendar, never by hand — 60 quiet days after a quote'

// --- rows -------------------------------------------------------------------

/**
 * `filters` is supplied membership, not a rule applied here — which is why
 * `ever-quoted` holds `customer` and `dormant` rows as well as `quoted` ones.
 */
const rows: CustomerRow[] = [
  {
    id: 1,
    name: 'Kofi Boateng',
    phone: '024 780 2215',
    status: 'quoted',
    stage: 'quoted 6 d ago',
    statusCaption: null,
    quietForDays: 2,
    dormantInDays: 58,
    warn: false,
    soon: false,
    lastSaid: 'Sending it to his wife tonight',
    roomCount: 6,
    filters: ['quoted', 'ever-quoted', 'everyone'],
    afterLog: null,
  },
  {
    id: 2,
    name: 'Esi Quaye',
    phone: '050 227 9904',
    status: 'quoted',
    stage: 'quoted 3 d ago',
    statusCaption: null,
    quietForDays: 3,
    dormantInDays: 57,
    warn: false,
    soon: false,
    lastSaid: null,
    roomCount: 4,
    filters: ['quoted', 'ever-quoted', 'everyone'],
    afterLog: null,
  },
  {
    id: 3,
    name: 'Nana Adjei',
    phone: '026 441 0038',
    status: 'enquiry',
    stage: 'first contact 5 d ago',
    statusCaption: null,
    quietForDays: 5,
    // No quote is out, so there is nothing to count down to.
    dormantInDays: null,
    warn: false,
    soon: false,
    lastSaid: 'Asked what a whole house comes to',
    roomCount: null,
    filters: ['enquiries', 'everyone'],
    afterLog: null,
  },
  {
    id: 4,
    name: 'Ama Boateng',
    phone: '024 318 6620',
    status: 'customer',
    stage: 'since Aug 2026',
    statusCaption: null,
    quietForDays: 7,
    dormantInDays: null,
    warn: false,
    soon: false,
    lastSaid: 'Paid the balance on the switches',
    roomCount: 6,
    filters: ['customers', 'ever-quoted', 'everyone'],
    afterLog: null,
  },
  {
    id: 5,
    name: 'Akosua Frimpong',
    phone: '055 340 7728',
    status: 'quoted',
    stage: 'quoted 9 d ago',
    statusCaption: null,
    quietForDays: 9,
    dormantInDays: 51,
    warn: false,
    soon: false,
    lastSaid: null,
    roomCount: 3,
    filters: ['quoted', 'ever-quoted', 'everyone'],
    afterLog: null,
  },
  {
    id: 6,
    name: 'Selasi Agbeko',
    phone: '059 812 3346',
    status: 'enquiry',
    stage: 'first contact 10 d ago',
    statusCaption: null,
    quietForDays: 10,
    dormantInDays: null,
    warn: false,
    soon: false,
    lastSaid: null,
    roomCount: null,
    filters: ['enquiries', 'everyone'],
    afterLog: null,
  },
  {
    id: 7,
    name: 'Yaw Darko',
    phone: '027 663 0091',
    status: 'quoted',
    stage: 'quoted 19 d ago',
    statusCaption: null,
    quietForDays: 12,
    dormantInDays: 48,
    warn: false,
    soon: false,
    lastSaid: 'Asked about paying in two parts',
    roomCount: 5,
    filters: ['quoted', 'ever-quoted', 'everyone'],
    afterLog: null,
  },
  {
    id: 8,
    name: 'Adwoa Sarpong',
    phone: '020 976 5512',
    status: 'enquiry',
    stage: 'first contact 16 d ago',
    statusCaption: null,
    quietForDays: 16,
    dormantInDays: null,
    warn: false,
    soon: false,
    lastSaid: 'Wants a price for two bedrooms',
    roomCount: null,
    filters: ['enquiries', 'everyone'],
    afterLog: null,
  },
  {
    id: 9,
    name: 'Abena Owusu',
    phone: '054 902 1167',
    status: 'quoted',
    stage: 'quoted 30 d ago',
    statusCaption: null,
    quietForDays: 21,
    dormantInDays: 39,
    warn: false,
    soon: false,
    lastSaid: 'Wants the gate camera added',
    roomCount: 7,
    filters: ['quoted', 'ever-quoted', 'everyone'],
    afterLog: null,
  },
  {
    id: 10,
    name: 'Kojo Mensah',
    phone: '024 205 7719',
    status: 'customer',
    stage: 'since Jun 2026',
    statusCaption: null,
    quietForDays: 28,
    dormantInDays: null,
    warn: false,
    soon: false,
    lastSaid: 'Wants the gate camera next',
    roomCount: 8,
    filters: ['customers', 'ever-quoted', 'everyone'],
    afterLog: null,
  },
  {
    id: 11,
    name: 'Kwabena Asante',
    phone: '024 551 8830',
    status: 'quoted',
    stage: 'quoted 44 d ago',
    statusCaption: null,
    quietForDays: 44,
    dormantInDays: 16,
    warn: true,
    soon: false,
    lastSaid: 'Checking with his brother in London',
    roomCount: 4,
    filters: ['quoted', 'ever-quoted', 'everyone'],
    afterLog: null,
  },
  {
    id: 12,
    name: 'Efua Mensah',
    phone: '020 118 4472',
    status: 'quoted',
    stage: 'quoted 58 d ago',
    statusCaption: null,
    quietForDays: 52,
    dormantInDays: 8,
    warn: true,
    soon: true,
    lastSaid: 'Said after her salary, end of month',
    roomCount: 5,
    filters: ['quoted', 'ever-quoted', 'everyone'],
    afterLog: null,
  },
  {
    id: 13,
    name: 'Kwame Ansah',
    phone: '027 334 9981',
    status: 'dormant',
    stage: 'dormant since 3 Sep',
    statusCaption: null,
    quietForDays: 87,
    dormantInDays: null,
    warn: true,
    soon: false,
    lastSaid: 'Said he would call back after the rains',
    roomCount: 4,
    filters: ['dormant', 'ever-quoted', 'everyone'],
    // State 4: the log clears the dormancy, and the data layer says so.
    afterLog: {
      status: 'quoted',
      stage: 'spoke today · quoted 87 d ago',
      statusCaption: 'dormant cleared',
    },
  },
  {
    id: 14,
    name: 'Afia Ofori',
    phone: '055 118 0042',
    status: 'customer',
    stage: 'since May 2026',
    statusCaption: null,
    quietForDays: 92,
    dormantInDays: null,
    warn: true,
    soon: false,
    lastSaid: 'Happy with the lights, nothing since',
    roomCount: 5,
    filters: ['customers', 'ever-quoted', 'everyone'],
    afterLog: null,
  },
  {
    id: 15,
    name: 'Dede Tetteh',
    phone: '050 661 2208',
    status: 'dormant',
    stage: 'dormant since 17 Aug',
    statusCaption: null,
    quietForDays: 104,
    dormantInDays: null,
    warn: true,
    soon: false,
    lastSaid: null,
    roomCount: null,
    filters: ['dormant', 'ever-quoted', 'everyone'],
    afterLog: {
      status: 'quoted',
      stage: 'spoke today · quoted 104 d ago',
      statusCaption: 'dormant cleared',
    },
  },
  {
    id: 16,
    name: 'Yaa Amponsah',
    phone: '026 590 4417',
    status: 'dormant',
    stage: 'dormant since 3 Aug',
    statusCaption: null,
    quietForDays: 118,
    dormantInDays: null,
    warn: true,
    soon: false,
    lastSaid: 'Never picked up',
    roomCount: 3,
    filters: ['dormant', 'ever-quoted', 'everyone'],
    afterLog: {
      status: 'quoted',
      stage: 'spoke today · quoted 118 d ago',
      statusCaption: 'dormant cleared',
    },
  },
]

export const CUSTOMER_ROWS: readonly CustomerRow[] = rows

// --- filters ----------------------------------------------------------------

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

/**
 * Labels with nothing counted. The toolbar renders from this on first paint:
 * the handoff wants the chips up immediately, and a label needs no round trip.
 */
export const CUSTOMER_FILTER_COPY: readonly CustomerFilterDef[] = CUSTOMER_FILTERS.map((key) => ({
  key,
  ...FILTER_COPY[key],
  count: null,
}))

/** Counted off the membership, so the mock cannot label a chip `7` and render six. */
export const CUSTOMER_FILTER_DEFS: readonly CustomerFilterDef[] = CUSTOMER_FILTERS.map((key) => ({
  key,
  ...FILTER_COPY[key],
  count: rows.filter((row) => row.filters.includes(key)).length,
}))

// --- duplicate check --------------------------------------------------------

/**
 * The duplicate check. Matched on digits so the spacing he types is never the
 * reason a duplicate gets through. Becomes `GET /customers?q=`.
 */
export function findDuplicateByPhone(phone: string): DuplicateMatch | null {
  const digits = phone.replace(/\D/g, '')
  // A shorter prefix would accuse half the list.
  if (digits.length < 6) return null

  const hit = rows.find((row) => row.phone.replace(/\D/g, '').startsWith(digits))
  return hit ? { id: hit.id, name: hit.name, phone: hit.phone } : null
}

/**
 * What `GET /customers` does not answer with yet, and which of these the screen
 * cannot be built without. Kept here beside the mock so the two stay in step.
 *
 *   - `stage` — the phrase under Stage. Derivable at the seam from
 *     `status` + `last_contact_at` + a quoted-at date, except there is no
 *     quoted-at on the row, so `quoted 58 d ago` and `since Aug 2026` have
 *     nothing to be built from. **Blocking.**
 *   - `dormant_in_days` — the countdown. Computable as
 *     `dormant_after_days - days_since_last_contact` once
 *     `GET /settings/dormancy` is read, but that is a rule, and this module does
 *     not own rules. Wanted on the row.
 *   - `warn` / `soon` — the two flags. Nothing on the wire carries them, and the
 *     handoff is explicit that the UI must not stand in for them with a
 *     threshold of its own. **Blocking.**
 *   - `last_said` — the latest note. Exists, but only via
 *     `GET /customers/{id}/contact-logs`, which is one request per row. Wanted
 *     on the list row.
 *   - `room_count` — D2's second line. Reachable as
 *     `GET /customers/{id}/houses` then `GET /houses/{id}/composition`, summed —
 *     two requests per row, for one number. Wanted on the list row.
 *   - filter counts — the six chip labels. `GET /customers` returns rows, not
 *     counts, and `status=` takes one status at a time, so `ever quoted · 13`
 *     is three requests or a client-side rule. Wanted as a counts endpoint.
 *   - the `ever-quoted` membership itself — needs a "has ever been quoted" fact,
 *     which `status` and `stored_status` cannot answer for a customer who was
 *     quoted and has since bought.
 */
