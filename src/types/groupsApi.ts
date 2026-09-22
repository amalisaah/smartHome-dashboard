/**
 * Wire types for the groups module, transcribed from `openapi.json`.
 *
 * These belong in `@/types/api` beside the rest of the contract; they sit here
 * only because that file was not to be touched. Fold them in and delete this
 * one. Same conventions: snake_case keys, money as integer pesewas, markup and
 * margin in basis points.
 *
 * What the spec actually offers the markup screen:
 *
 *   - `GET /groups/details` — the table: the markup and the aggregates beside
 *     it, one request.
 *   - `POST /groups`        — create. Duplicate name is a **409**.
 *   - `PATCH /groups/{id}`  — rename and/or re-markup, one group at a time.
 *   - `DELETE /groups/{id}` — archive. This screen does not offer it.
 *
 * What it does not offer, and the screen needs — see `PROPOSED` below:
 * a projection while he types, and the overridden count the commit bar says
 * out loud.
 */

/**
 * `GET /groups/details` — every group with the numbers a group list needs.
 * A group with no items answers with zeroes rather than dropping out.
 */
export interface ApiGroupDetails {
  id: number
  name: string
  /** Stable across renames — not re-derived when the name changes. */
  slug: string
  /**
   * Basis points — 6000 = a markup of 1.60. The field this screen edits.
   *
   * Being added to `/groups/details`; until then it lives only on
   * `GET /groups`, and the table has to join the two by id to draw a row.
   */
  default_markup_bps: number
  /** Active items filed here, received or not. */
  item_count: number
  units_in_stock: number
  /** `SUM(stock_on_hand × landed_unit_cost_pesewas)` — money tied up right now. */
  capital_in_stock_pesewas: number
  /** `SUM(stock_on_hand × selling_price_pesewas)` — override if set, else derived. */
  retail_value_pesewas: number
  /**
   * The group's blended gross margin on the stock it holds:
   * `1 − capital_in_stock / retail_value`, **weighted by money**, so a line
   * sitting on a lot of stock counts for more than one sitting on a little.
   * Measured out of the selling price, not against cost — a 6000 bps markup is
   * a 3750 bps margin, and this reports the latter.
   *
   * Equal to that markup-implied figure until an item is priced by hand; an
   * override is what pulls it away, and pulls it negative below landed cost.
   * That drift is exactly what the column is for.
   *
   * Null when there is no stock with a selling price to take a share of — an
   * empty group, one where nothing has been received, one priced at zero, or
   * one over-issued to a negative balance. Null rather than 0, which would
   * read as selling at cost.
   */
  margin_bps: number | null
  /** Cumulative: unlike `units_in_stock` it does not fall when stock leaves. */
  units_ever_received: number
  /** What those units actually cost, freight included. */
  total_spend_pesewas: number
}

/** `?archived=true` includes archived groups, matching `GET /groups`. */
export interface ApiGroupDetailsQuery {
  archived?: boolean
}

/**
 * `POST /groups` → 201. Only `name` is required; the slug is derived
 * server-side and `default_markup_bps` defaults to 0 (a markup of 1.00, which
 * is the only honest reading of a blank: it sells at cost until he says
 * otherwise).
 *
 * A duplicate name is a **409**, not a 400 with field details — so the screen
 * cannot read a `details[].path` to find the offending row. It knows which row
 * it sent, which is enough here.
 */
export interface ApiGroupCreate {
  name: string
  default_markup_bps?: number
  sort_order?: number
}

/**
 * `PATCH /groups/{id}` → 200. Partial: omitted fields are left untouched, and
 * the slug is not re-derived on rename.
 *
 * Changing `default_markup_bps` needs no backfill — selling prices for
 * non-overridden items are derived on read — so the write is cheap and takes
 * effect everywhere at once.
 */
export interface ApiGroupUpdate {
  name?: string
  default_markup_bps?: number
  sort_order?: number
}

/* ===========================================================================
 * PROPOSED — not in `openapi.json`. Two gaps between what the screen renders
 * and what the API can answer.
 *
 * 1. THE OVERRIDDEN COUNT. The commit bar says "39 of 44" and "5 overridden
 *    items keep their prices" — rule 2 of the screen, the exclusion stated in
 *    numbers. Nothing in `/groups/details` carries it. It is derivable on the
 *    client by counting `selling_price_override_pesewas !== null` over
 *    `GET /items`, which the catalogue already loads unpaginated — a fallback,
 *    not a plan, since it ties this screen to that fetch.
 *
 * 2. THE PROJECTION WHILE HE TYPES. `33% → 39%` and the worked example need
 *    the margin at a markup that has not been saved. It cannot be computed
 *    from `/groups/details` as it stands, because the overridden items — the
 *    ones that will not move — are not separable from the ones that will.
 *
 *    Three fields close both gaps and need no new endpoint, which is why this
 *    is the recommendation over a preview call: with the overridden capital
 *    and retail split out, the projection is exact local arithmetic and costs
 *    no round trip per keystroke.
 *
 *      new_retail = (capital_in_stock − overridden_capital) × new_markup
 *                 + overridden_retail
 *      new_margin = 1 − capital_in_stock / new_retail
 * ======================================================================== */
export interface ApiGroupOverrideSplit {
  /** Items carrying a `selling_price_override_pesewas`. A markup skips them. */
  overridden_count: number
  /** The `capital_in_stock_pesewas` those items account for. */
  overridden_capital_in_stock_pesewas: number
  /** The `retail_value_pesewas` those items account for — fixed under a re-markup. */
  overridden_retail_value_pesewas: number
}

/** What `GET /groups/details` would return with the split above added. */
export interface ApiGroupDetailsWithSplit extends ApiGroupDetails, ApiGroupOverrideSplit {}
