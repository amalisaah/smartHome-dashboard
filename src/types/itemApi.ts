/**
 * The wire contract for one item, mirroring `openapi.json`. Only `@/api` and
 * `@/utils/mapper` import these; everything else speaks `@/types/item`.
 */

import type { ApiItem } from './api'

/**
 * `GET /items/{id}`. Field-for-field the `GET /items` row, so it is that type
 * rather than a copy. Archived items answer 200, so a 200 is not "active".
 */
export type ApiItemDetail = ApiItem

/**
 * `PATCH /items/{id}` — omitted fields are left untouched, and the response
 * carries freshly derived cost, price and stock.
 *
 * **Only the price override takes a null.** Sending it clears the override and
 * returns the item to its group markup, which is what `Back to group default`
 * does. Every other field answers 400 `received null` — checked field by field
 * against the running API — so:
 *
 *   - Text fields and `keywords` clear with `""` / `[]`, which is accepted, and
 *     the screen reads `""` and `null` alike, so those clears are real.
 *   - `group_id` cannot be cleared: there is no un-filing an item.
 *   - `lead_time_days` cannot be cleared to "unknown"; `0` means zero days.
 *
 * `toItemUpdate` omits those two and reports them in `unexpressible`.
 */
export interface ApiItemUpdate {
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
  /** Null returns the item to its group markup. */
  selling_price_override_pesewas?: number | null
  notes?: string
  image_url?: string
}

export type ApiMovementReason = 'shipment_in' | 'job_out' | 'adjustment' | 'return' | 'damage'

/**
 * One row of the append-only ledger, from `GET /items/{id}/movements` (newest
 * first). Note what is *not* here: a running balance, and any composed
 * description. Both are derived — see `@/utils/mapper/itemMapper`.
 */
export interface ApiMovement {
  id: number
  item_id: number
  /** Positive adds stock, negative removes it. */
  quantity_delta: number
  reason: ApiMovementReason
  /** A shipment id on `shipment_in`; null on a manual adjustment. */
  reference_id: number | null
  note: string | null
  occurred_at: string
}

/**
 * `POST /items/{id}/adjustments`. Both fields required — the endpoint's rule and
 * the screen's. It appends a movement, so `stock_on_hand` moves by this delta.
 */
export interface ApiAdjustmentCreate {
  quantity_delta: number
  /** Trimmed, and a blank one is rejected. */
  note: string
}

/** `POST /items/{id}/discontinue`. A blank reason is rejected. */
export interface ApiDiscontinueCreate {
  reason: string
}
