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

/** The error envelope every route shares. */
export interface ApiError {
  statusCode: number
  error: string
  message: string
  /** Present on validation failures (400). */
  details?: { path: string; message: string }[]
}
