/**
 * The wire contract, mirroring `openapi.json` exactly: snake_case keys, money as
 * integer pesewas (1 GHS = 100 pesewas), timestamps as ISO date-time strings.
 *
 * Nothing outside `@/api` and `@/utils/mapper` should import these — the rest of
 * the app speaks the view model in `@/types/catalogue`. Keeping the two apart
 * means a backend rename lands in one mapper rather than in every component.
 */

/** The group an item belongs to, embedded on the item row. */
export interface ApiGroupRef {
  id: number
  name: string
  /** Stable across renames, so it is safe as a filter value and in a URL. */
  slug: string
}

/** `GET /groups` */
export interface ApiGroup {
  id: number
  name: string
  slug: string
  /** Basis points — 6000 = 60%. */
  default_markup_bps: number
  sort_order: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

/** `GET /items` */
export interface ApiItem {
  id: number
  /** Null on a stub item. */
  name: string | null
  group_id: number | null
  group: ApiGroupRef | null
  keywords: string[]
  unit: string | null
  supplier_name: string | null
  supplier_url: string | null
  supplier_contact: string | null
  lead_time_days: number | null
  reorder_level: number
  selling_price_override_pesewas: number | null
  notes: string | null
  image_url: string | null
  /** Derived: quantity-weighted average landed cost, 0 if never received. */
  landed_unit_cost_pesewas: number
  /** Derived: the override if set, else landed cost grown by the group markup. */
  selling_price_pesewas: number
  /** Derived: the sum of every stock movement. */
  stock_on_hand: number
  /** Derived: name or group missing, or supplier_url missing while not discontinued. */
  needs_attention: boolean
  /** Set once the item will not be reordered. Still stocked, still priced, still sold. */
  discontinued_at: string | null
  discontinue_reason: string | null
  /** Derived: discontinued and sold through (`stock_on_hand <= 0`). */
  ready_to_archive: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

/** `GET /summary` — the nine dashboard numbers. */
export interface ApiSummary {
  capital_in_stock_pesewas: number
  retail_value_pesewas: number
  units_in_stock: number
  items_needing_restock: number
  /** Null when nothing needs restock, or none of those items has a lead time. */
  longest_restock_lead_days: number | null
  items_needing_attention: number
  items_ready_to_archive: number
  draft_shipment_count: number
  /** Null when no draft has anything to estimate an arrival from. */
  next_draft_eta: string | null
}

// --- shipments --------------------------------------------------------------

export type ApiCurrency = 'USD' | 'CNY' | 'GHS'

/** How shared costs will be spread across lines on receive. */
export type ApiAllocationMethod = 'by_value' | 'per_unit' | 'manual'

export type ApiShipmentStatus = 'draft' | 'received'

/** `GET /shipments` — the header only; lines and costs come with the detail. */
export interface ApiShipment {
  id: number
  supplier_name: string
  ordered_at: string | null
  /** The arrival he was quoted, if he was quoted one. */
  eta_override: string | null
  /** Derived: the override if set, else `ordered_at` plus the longest lead time. */
  eta: string | null
  eta_source: 'override' | 'lead_time' | null
  received_at: string | null
  currency: ApiCurrency
  /** Rate to GHS ×100 — 1650 is 16.50. Recorded only: the pesewas below are GHS. */
  fx_rate_to_ghs: number
  allocation_method: ApiAllocationMethod
  notes: string | null
  status: ApiShipmentStatus
  /** What the lines come to — quantity × unit price, summed. Already GHS. */
  product_value_total_pesewas: number
  /** What the costs he named come to, summed. Already GHS. */
  shared_cost_total_pesewas: number
  created_at: string
  updated_at: string
}

/** A cost he named himself. There are no fixed freight / duty / other fields. */
export interface ApiShipmentCostLine {
  id: number
  shipment_id: number
  label: string
  amount_pesewas: number
}

/** A line of the supplier's invoice. Every figure is already GHS pesewas. */
export interface ApiShipmentLine {
  id: number
  shipment_id: number
  item_id: number
  quantity: number
  unit_price_pesewas: number
  manual_allocation_pesewas: number | null
  /** Derived, and null until the allocation has been worked out. */
  line_product_value_pesewas: number | null
  allocated_shared_cost_pesewas: number | null
  landed_unit_cost_pesewas: number | null
}

/** `GET /shipments/{id}` and `GET /shipments/{id}/preview` — the whole document. */
export interface ApiShipmentDetail extends ApiShipment {
  cost_lines: ApiShipmentCostLine[]
  lines: ApiShipmentLine[]
}

/** `POST /shipments`. */
export interface ApiShipmentCreate {
  supplier_name: string
  ordered_at?: string
  eta_override?: string | null
  currency: ApiCurrency
  fx_rate_to_ghs?: number
  allocation_method: ApiAllocationMethod
  notes?: string
}

/** `PATCH /shipments/{id}`. `cost_lines` replaces the set wholesale. */
export interface ApiShipmentUpdate {
  supplier_name?: string
  ordered_at?: string
  eta_override?: string | null
  currency?: ApiCurrency
  fx_rate_to_ghs?: number
  allocation_method?: ApiAllocationMethod
  notes?: string
  cost_lines?: { label: string; amount_pesewas: number }[]
}

/**
 * One entry of the array `POST /shipments/{id}/lines` takes. A new line needs
 * the item, the count and the price.
 */
export interface ApiShipmentLineWrite {
  item_id: number
  quantity: number
  unit_price_pesewas: number
  manual_allocation_pesewas?: number
}

/**
 * `PATCH .../lines/{lineId}` — "fields to change; omitted fields are left
 * untouched", so a caller changing one figure sends one figure.
 */
export type ApiShipmentLineUpdate = Partial<ApiShipmentLineWrite>

/**
 * `POST /items` — every field optional, so a name alone creates a stub item.
 * Unlike `PATCH`, nothing here is a *clear*: a field left out is one he has not
 * filled in.
 */
export interface ApiItemCreate {
  name?: string
  group_id?: number
  keywords?: string[]
  unit?: string
  supplier_name?: string
  supplier_url?: string
  supplier_contact?: string
  /** At most 1000 on the wire. */
  lead_time_days?: number
  reorder_level?: number
  /** A fixed price that beats the group markup, in integer pesewas. */
  selling_price_override_pesewas?: number
  notes?: string
  image_url?: string
}

// --- customers --------------------------------------------------------------

/** The four words, in these spellings. */
export type ApiCustomerStatus = 'enquiry' | 'quoted' | 'customer' | 'dormant'

/** `GET /customers`, `GET /customers/{id}`, and what a create or a contact answers with. */
export interface ApiCustomer {
  id: number
  /** A placeholder once anonymised. */
  name: string
  phone: string | null
  alt_phone: string | null
  email: string | null
  /**
   * The *effective* status. `dormant` is derived on read from
   * `stored_status = quoted` plus a stale `last_contact_at`, which is why
   * logging any contact clears it with no write to this field.
   */
  status: ApiCustomerStatus
  /** The status actually on the row. Never `dormant`. */
  stored_status: ApiCustomerStatus
  /** The latest contact-log entry's `occurred_at`. Derived, never writable. */
  last_contact_at: string | null
  /** Whole days since `last_contact_at`; null when never contacted. */
  days_since_last_contact: number | null
  source: string | null
  notes: string | null
  anonymised_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

/** `POST /customers`. Only `name` is required; `dormant` is rejected. */
export interface ApiCustomerCreate {
  name: string
  phone?: string | null
  alt_phone?: string | null
  email?: string | null
  status?: Exclude<ApiCustomerStatus, 'dormant'>
  source?: string | null
  notes?: string | null
}

/**
 * `PATCH /customers/{id}`. Partial: an omitted field is left untouched and an
 * explicit `null` clears a nullable one — which is the difference between "I am
 * not editing her number" and "she has no number".
 *
 * `status` is accepted here but deliberately absent below: block F's edit form
 * is name and phone, and `dormant` would be rejected anyway, being derived.
 * **An anonymised customer cannot be edited at all.**
 */
export interface ApiCustomerUpdate {
  name?: string
  phone?: string | null
  alt_phone?: string | null
  email?: string | null
  source?: string | null
  notes?: string | null
}

export type ApiContactKind = 'call' | 'whatsapp' | 'visit' | 'quote_sent' | 'other'

/** An entry of `GET /customers/{id}/contact-logs`. */
export interface ApiContactLogEntry {
  id: number
  customer_id: number
  kind: ApiContactKind
  note: string | null
  occurred_at: string
}

/** `POST /customers/{id}/contact` — the customer comes back already moved. */
export interface ApiContactResult {
  entry: ApiContactLogEntry
  customer: ApiCustomer
}

/**
 * Structured because it is quotable: no internet means a router, an extender and
 * sometimes a subscription, and that is money on a quote.
 */
export type ApiInternetQuality = 'reliable' | 'weak' | 'none' | 'unknown'

/**
 * An item of `GET /customers/{id}/houses`.
 *
 * Note what is **not** here: no room count, no device count, no fault count.
 * Those live behind `GET /houses/{id}/composition` and
 * `GET /houses/{id}/installed-devices`, one call per house.
 *
 * Note also what is here and must never reach the customer screen —
 * `address_text`, `landmark_directions`, `gps_lat`, `gps_lng`, `access_notes`.
 * Those belong inside the house, and block F says so on the screen itself.
 */
export interface ApiHouse {
  id: number
  customer_id: number
  /** Short name, e.g. "Spintex house". */
  label: string | null
  address_text: string | null
  landmark_directions: string | null
  gps_lat: number | null
  gps_lng: number | null
  access_notes: string | null
  /** Whether the wall boxes have a neutral wire — the expensive thing to learn. */
  wiring_notes: string | null
  internet_quality: ApiInternetQuality
  internet_notes: string | null
  notes: string | null
  /** Soft-delete timestamp. */
  archived_at: string | null
  created_at: string
  updated_at: string
}

/** `GET /settings/dormancy`. */
export interface ApiDormancySettings {
  dormant_after_days: number
  /** The shipped default, for a "reset" affordance. */
  default_dormant_after_days: number
}

/** The error envelope every route shares. */
export interface ApiError {
  statusCode: number
  error: string
  message: string
  /** Present on validation failures (400). */
  details?: { path: string; message: string }[]
}
