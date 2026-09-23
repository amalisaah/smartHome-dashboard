/**
 * The wire contract for one item, mirroring `openapi.json` exactly: snake_case
 * keys, money as integer pesewas, timestamps as ISO date-time strings.
 *
 * Nothing outside `@/api` and `@/utils/mapper` should import these — the rest of
 * the app speaks the view model in `@/types/item`.
 */

import type { ApiItem } from './api'

/**
 * `GET /items/{id}`. The response schema is field-for-field the `GET /items` row,
 * so it is that type rather than a copy of it — if the two ever diverge, the
 * divergence belongs here and not in a second hand-maintained interface.
 *
 * Archived items stay reachable by id, so a 200 does not mean "active".
 */
export type ApiItemDetail = ApiItem

/**
 * `PATCH /items/{id}` — "omitted fields are left untouched", and the response
 * carries freshly derived cost, price and stock, so a new override is reflected
 * immediately and there is nothing to splice client-side.
 *
 * **No nulls, and that is a limitation rather than a style.** Every field here is
 * its bare type in `openapi.json`, and the running API enforces it: sending
 * `null` answers 400 `expected number, received null` (checked against
 * `PATCH /items/2` for `selling_price_override_pesewas`, `group_id` and `name`).
 * Meanwhile `GET` documents the stored values as nullable — so these fields do
 * hold null; the write side has no way to put it there.
 *
 * What that costs, precisely:
 *
 *   - **Text fields clear with `""`.** Verified accepted, and the screen reads
 *     `""` and `null` the same way, so a cleared name, supplier or note
 *     round-trips correctly. `keywords: []` likewise.
 *   - **`group_id` cannot be cleared.** There is no way to un-file an item once
 *     filed (`null` is a 400; `0` fails `exclusiveMinimum`).
 *   - **`lead_time_days` cannot be cleared to "unknown".** `0` is accepted but
 *     means *zero days*, which is a different claim. An emptied field is
 *     therefore omitted, not zeroed.
 *   - **The price override cannot be cleared, so `Back to group default` has no
 *     expression on the wire.** `0` is accepted and stored as an override of
 *     zero — the item would then sell for nothing. See `clearPriceOverride` in
 *     `@/api/item`, which refuses rather than pricing an item at zero.
 *
 * The fix is on the API: a null branch on these fields, or an explicit clear
 * (`DELETE /items/{id}/override`, or a `clear: ["group_id", …]` list).
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
  /** Beats the group markup. There is no accepted value meaning "use the markup". */
  selling_price_override_pesewas?: number
  notes?: string
  image_url?: string
}

/**
 * Why the stock moved. `adjustment` is the manual correction the Adjust-count
 * sheet writes; the rest are written by other parts of the system.
 */
export type ApiMovementReason = 'shipment_in' | 'job_out' | 'adjustment' | 'return' | 'damage'

/**
 * One row of the append-only stock ledger, from `GET /items/{id}/movements`
 * (newest first). Nothing is ever removed, so a reversed shipment shows as both
 * its original movement and the negative that undid it.
 *
 * Note what is **not** here: a running balance, and any composed description.
 * Both are derived — see `@/utils/mapper/itemMapper`.
 */
export interface ApiMovement {
  id: number
  item_id: number
  /** Signed: positive adds stock, negative removes it. */
  quantity_delta: number
  reason: ApiMovementReason
  /** The record it came from — a shipment id on `shipment_in`; null on an adjustment. */
  reference_id: number | null
  note: string | null
  occurred_at: string
}

/**
 * `POST /items/{id}/adjustments`. Both fields are required, and that is the
 * screen's rule too: a count that changed without a reason is the thing the
 * item screen exists to prevent. It appends a movement rather than overwriting
 * a balance, so `stock_on_hand` moves by exactly this delta.
 */
export interface ApiAdjustmentCreate {
  /** Signed change in units. */
  quantity_delta: number
  /** Why. Trimmed, and a blank one is rejected. */
  note: string
}

/** `POST /items/{id}/discontinue`. A blank reason is rejected. */
export interface ApiDiscontinueCreate {
  reason: string
}
