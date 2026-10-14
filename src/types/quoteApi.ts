/**
 * The quote endpoints' wire contract, mirroring `openapi.json` exactly:
 * snake_case keys, money as integer pesewas (1 GHS = 100 pesewas), timestamps as
 * ISO date-time strings.
 *
 * Nothing outside `@/api` and `@/utils/mapper` should import these — the rest of
 * the app speaks the view model in `@/types/quote`.
 *
 * The one thing to notice here is that **the cost wall is a wire boundary, not a
 * screen rule**. `ApiQuoteOwnerView` carries cost, profit and the floor;
 * `ApiQuoteCustomerView` is a different shape built by a serializer whose input
 * type has no cost field on it, and it is the *only* thing her view is given.
 * The two must not be merged into one optional-field type, because then a
 * mistake upstream could put a cost into her view's props and nothing would
 * stop it.
 */

import type { ApiSpaceSlug } from '@/types/api'

/** The sales ladder she picked from. A label, referencing no recipe. */
export type ApiQuoteLevel = 'basic' | 'comfortable' | 'premium' | 'luxury' | 'custom'

/** `draft -> sent -> accepted | declined` */
export type ApiQuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined'

/**
 * Present only when the quantity exceeds stock on hand. Advisory: a quote
 * reserves nothing and draws down nothing, so this never blocks a write.
 */
export interface ApiQuoteStockWarning {
  stock_on_hand: number
  /** The difference between a job next week and one next month. Null when unknown. */
  lead_time_days: number | null
  short_by: number
}

/** The room as the line recorded it, snapshotted when the line was created. */
export interface ApiQuoteLineRoom {
  id: number
  name: string | null
  space_slug: ApiSpaceSlug | null
}

/**
 * A quote line. Carries both its room and its need, so the same list groups
 * either way without a second read.
 */
export interface ApiQuoteLine {
  id: number
  quote_id: number
  /** Null for whole-house equipment that belongs to no room — the hub, the lock. */
  room_id: number | null
  room: ApiQuoteLineRoom | null
  item_id: number
  item_name: string | null
  need: string
  quantity: number
  /** Snapshotted at creation, and never moved again by a later shipment. */
  unit_selling_price_pesewas: number
  /** OWNER-ONLY. The same snapshot, for what it cost him. */
  unit_landed_cost_pesewas: number
  line_selling_total_pesewas: number
  note: string | null
  /** A line taken out during negotiation is switched off, never deleted. */
  is_removed: boolean
  removed_at: string | null
  sort_order: number
  stock_warning: ApiQuoteStockWarning | null
  created_at: string
  updated_at: string
}

/** OWNER-ONLY money. Never returned by any customer-facing representation. */
export interface ApiQuoteMoney {
  device_total_pesewas: number
  labour_charge_pesewas: number
  /** True while no labour has been set by hand: it is `room_count x labour_rate`. */
  labour_charge_is_derived: boolean
  materials_charge_pesewas: number
  /** True while no materials charge has been set by hand: misc plus the markup. */
  materials_charge_is_derived: boolean
  room_count: number
  proposed_total_pesewas: number
  misc_cost_estimate_pesewas: number
  /** Device landed cost plus the misc estimate. Labour is charged, not costed. */
  cost_total_pesewas: number
  expected_profit_pesewas: number
  /** `agreed_total` when set, else `proposed_total`. */
  measured_against_pesewas: number
}

/** `GET /quotes/{id}/owner-view` */
export interface ApiQuoteOwnerView {
  id: number
  customer_id: number
  house_id: number
  level_label: ApiQuoteLevel
  status: ApiQuoteStatus
  title: string | null
  misc_cost_estimate_pesewas: number
  agreed_total_pesewas: number | null
  declined_reason: string | null
  notes: string | null
  sent_at: string | null
  accepted_at: string | null
  declined_at: string | null
  /** Set when the quote is sent; prices can no longer be refreshed after. */
  prices_frozen_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
  money: ApiQuoteMoney
  lines: ApiQuoteLine[]
}

/** One need's subtotal on her quote. */
export interface ApiCustomerGroup {
  need: string
  total_pesewas: number
}

/** One line on her quote, present only when he itemised it. */
export interface ApiCustomerItem {
  need: string
  room_name: string | null
  item_name: string | null
  quantity: number
  unit_price_pesewas: number
  line_total_pesewas: number
}

/**
 * `GET /quotes/{id}/customer-view`. Grouped by need, largest first. There is no
 * cost field on this type and there must never be one.
 */
export interface ApiQuoteCustomerView {
  quote_id: number
  title: string | null
  level_label: string
  status: string
  groups: ApiCustomerGroup[]
  /** Installation. */
  labour_charge_pesewas: number
  materials_charge_pesewas: number
  /** What she is asked for. */
  total_pesewas: number
  /** Null unless `?itemised=true`. */
  items: ApiCustomerItem[] | null
}

/** `GET /quotes/{id}/rooms` — the rooms of this quote's house. */
export interface ApiQuoteRoom {
  id: number
  name: string
  space_slug: ApiSpaceSlug
  sort_order: number
  archived_at: string | null
}

/** `POST /quotes/{id}/lines` */
export interface ApiQuoteLineCreate {
  item_id: number
  quantity?: number
  /** Defaults to the catalogue item's group slug when left out. */
  need?: string
  note?: string | null
  room_id?: number | null
}

/** `PATCH /quote-lines/{id}` — unset keys are not sent and mean "unchanged". */
export interface ApiQuoteLineUpdate {
  quantity?: number
  need?: string
  note?: string | null
  room_id?: number | null
}

/**
 * `PATCH /quotes/{id}/charges`. Leave either charge `null` and it derives again —
 * labour from the room count, materials from the misc estimate plus the markup.
 * That is why the two charges are `number | null | undefined` and not optional
 * numbers: `undefined` is "unchanged", `null` is "go back to deriving it".
 */
export interface ApiQuoteChargesUpdate {
  labour_charge_pesewas?: number | null
  materials_charge_pesewas?: number | null
  /** OWNER-ONLY. Cable, trunking, screws, fuel, ladder hire. */
  misc_cost_estimate_pesewas?: number
}
