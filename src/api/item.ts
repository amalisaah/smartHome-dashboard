/**
 * The seam between the wire and the item-detail screen. Answers are mapped
 * through `@/utils/mapper/itemMapper`, so no component sees a snake_case key or
 * a `_pesewas` suffix.
 *
 * The screen is three calls, not one: the item, the groups, and the ledger. They
 * are kept apart deliberately — a movements list that 500s should cost the screen
 * its ledger and not the fields he was typing into. `toItemDerived` composes them
 * wherever they have all landed.
 */

import type { ItemRecord } from '@/types/item'
import type {
  ApiAdjustmentCreate,
  ApiDiscontinueCreate,
  ApiItemDetail,
  ApiItemUpdate,
  ApiMovement,
} from '@/types/itemApi'
import { toItemRecord } from '@/utils/mapper/itemMapper'
import { ApiRequestError, apiGet, apiSend } from './http'

/**
 * `GET /items/{id}`. An archived item still answers 200 — `archivedAt` on the
 * record is what says so, and it is the screen's business what to do about it.
 */
export async function fetchItem(id: number, signal?: AbortSignal): Promise<ItemRecord> {
  return toItemRecord(await apiGet<ApiItemDetail>(`/items/${id}`, undefined, signal))
}

/**
 * `GET /items/{id}/movements` — the full ledger, newest first.
 *
 * Returned as the wire rows rather than as view-model `Movement`s: a row's
 * running balance is anchored on the item's `stock_on_hand`, and its landed-cost
 * caption counts lots off the whole ledger, so the mapping needs the item beside
 * it. `toMovements` / `toItemDerived` do that once both have arrived.
 */
export async function fetchItemMovements(
  id: number,
  signal?: AbortSignal,
): Promise<ApiMovement[]> {
  return apiGet<ApiMovement[]>(`/items/${id}/movements`, undefined, signal)
}

/**
 * `PATCH /items/{id}`. The answer carries freshly derived cost, price and stock,
 * so an override lands on the next read with nothing to splice — which is why
 * this returns the mapped record and the hook writes it into the cache.
 */
export async function updateItem(id: number, body: ApiItemUpdate): Promise<ItemRecord> {
  return toItemRecord(await apiSend<ApiItemDetail>('PATCH', `/items/${id}`, body))
}

/** Set the fixed price that beats the group markup. */
export const setPriceOverride = (id: number, pesewas: number) =>
  updateItem(id, { selling_price_override_pesewas: pesewas })

/**
 * `Back to group default`, which **the API cannot currently do**.
 *
 * The stored field is nullable and `null` is what returns an item to its
 * markup, but `PATCH` answers 400 on null and accepts `0` as a real override of
 * zero — so the two ways of "clearing" it are a rejection and pricing the item
 * at nothing. Neither is the operation.
 *
 * So this refuses, through the same error channel every other call uses, rather
 * than writing a price nobody asked for. `status: 501` because the request is
 * right and the endpoint does not implement it; `isRetryableError` leaves 501
 * alone, so it surfaces immediately instead of after three attempts.
 *
 * Delete this the day `PATCH` takes a null, or a `DELETE /items/{id}/override`
 * exists, and point `useClearPriceOverride` at it.
 */
export async function clearPriceOverride(_id: number): Promise<never> {
  throw new ApiRequestError(
    501,
    'Returning to the group default needs an API that can clear the override — it only accepts a figure today.',
  )
}

/**
 * `DELETE /items/{id}` — the soft delete the Archive dialog promises: it stamps
 * `archived_at`, the row survives, and it stays reachable through
 * `GET /items?archived=true`. Nothing is ever hard-deleted, because an item on a
 * received shipment is part of that shipment's history.
 */
export async function archiveItem(id: number): Promise<ItemRecord> {
  return toItemRecord(await apiSend<ApiItemDetail>('DELETE', `/items/${id}`))
}

/**
 * `POST /items/{id}/adjustments`. Appends a movement and returns it; stock moves
 * by exactly this delta. The note is required by the endpoint and by the sheet —
 * a count that changed without a reason is what the ledger exists to prevent.
 */
export async function createAdjustment(
  id: number,
  body: ApiAdjustmentCreate,
): Promise<ApiMovement> {
  return apiSend<ApiMovement>('POST', `/items/${id}/adjustments`, body)
}

/**
 * `POST /items/{id}/discontinue` — the state between active and archived: the
 * item keeps its stock, its price and its place in the catalogue, and the
 * remainder is sold through. No UI in this handoff; here because it is part of
 * the item's surface and the screen that needs it will not want to add the seam.
 */
export async function discontinueItem(
  id: number,
  body: ApiDiscontinueCreate,
): Promise<ItemRecord> {
  return toItemRecord(await apiSend<ApiItemDetail>('POST', `/items/${id}/discontinue`, body))
}

/**
 * `POST /items/{id}/un-discontinue`. Unlike discontinue this is **not**
 * idempotent — an item that is not discontinued answers 409, so a double press
 * is an error rather than a no-op.
 */
export async function unDiscontinueItem(id: number): Promise<ItemRecord> {
  return toItemRecord(await apiSend<ApiItemDetail>('POST', `/items/${id}/un-discontinue`))
}
