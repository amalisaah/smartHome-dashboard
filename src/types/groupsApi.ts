/**
 * Wire types for the groups module, transcribed from `openapi.json`. They
 * belong in `@/types/api` beside the rest of the contract; fold them in and
 * delete this file.
 *
 * TODO: the commit bar's worked example — `the 2-gang switch goes 373.00 →
 * 410.19` — is not built. Naming an item needs an item, and nothing about a
 * group carries one; the source is `GET /items?group_id=`, where `name`,
 * `landed_unit_cost_pesewas` and `selling_price_override_pesewas` are enough.
 * Nothing new is needed on `/groups/details` for it.
 */

/** `GET /groups/details` — a group with the numbers a group list needs. */
export interface ApiGroupDetails {
  id: number
  name: string
  /** Stable across renames — not re-derived when the name changes. */
  slug: string
  /** Basis points — 6000 = a markup of 1.60. The field this screen edits. */
  default_markup_bps: number
  /** Active items filed here, received or not. */
  item_count: number
  /**
   * How many of those price themselves, carrying a `selling_price_override_pesewas`
   * instead of taking the markup. The two read as a fraction: `item_count` less
   * this is the reach of a markup change, and this is what keeps its prices.
   */
  overridden_item_count: number
  units_in_stock: number
  /** `SUM(stock_on_hand × landed_unit_cost_pesewas)`. */
  capital_in_stock_pesewas: number
  /** `SUM(stock_on_hand × selling_price_pesewas)` — override if set, else derived. */
  retail_value_pesewas: number
  /**
   * `1 − capital_in_stock / retail_value`, weighted by money. A *margin*, not a
   * markup: 6000 bps of markup reports 3750 bps here. Equal to that restated
   * figure until an item is priced by hand — the drift is what it is for.
   *
   * Null where there is no priced stock to take a share of: an empty group, one
   * where nothing has been received, one priced at zero. Null rather than 0,
   * which would read as selling at cost.
   */
  margin_bps: number | null
  /** Cumulative — unlike `units_in_stock` it does not fall when stock leaves. */
  units_ever_received: number
  total_spend_pesewas: number
}

export interface ApiGroupDetailsQuery {
  archived?: boolean
}

/** `POST /groups` → 201. Slug derived server-side; a duplicate name is a 409. */
export interface ApiGroupCreate {
  name: string
  default_markup_bps?: number
  sort_order?: number
}

/** `PATCH /groups/{id}` → 200. Partial; the slug is not re-derived on rename. */
export interface ApiGroupUpdate {
  name?: string
  default_markup_bps?: number
  sort_order?: number
}
