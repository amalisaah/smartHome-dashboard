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
  /** Basis points — 6000 = a markup of 1.60. The field this screen edits. */
  default_markup_bps: number
  /** Active items filed here, received or not. */
  item_count: number
  /**
   * How many of those price themselves — they carry a
   * `selling_price_override_pesewas` instead of taking the group's markup.
   *
   * The two read as a fraction, which is what the commit bar says out loud:
   * `item_count − overridden_item_count` is the reach of a markup change
   * (`39 of 44`), and this is the remainder that keeps its prices. Zero means
   * the whole group is priced off `default_markup_bps`, and `margin_bps` is
   * then that markup restated.
   */
  overridden_item_count: number
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
 * TODO: the commit bar's worked example — `Example: the 2-gang switch goes
 * 373.00 → 410.19` — is not built. It is rule 3 of the screen: an aggregate
 * count is abstract, a named item is checkable.
 *
 * It is out because it needs an item, and nothing about a group can name one.
 * `GET /items?group_id=` is the source: `name`, `landed_unit_cost_pesewas` and
 * `selling_price_override_pesewas` are enough to pick an item the markup
 * actually reaches and say what its price would become. Nothing new is needed
 * on `/groups/details` for it.
 *
 * The projected *margin* is not coming back — the Avg margin cell holds still
 * while he types, by decision, and the bar states the consequence in counts.
 * ======================================================================== */
