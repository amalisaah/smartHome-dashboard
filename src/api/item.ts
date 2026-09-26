/**
 * The seam between the wire and the item screen. Answers are mapped through
 * `@/utils/mapper/itemMapper`, so no component sees a snake_case key.
 *
 * The screen is three calls, not one — the item, the groups, the ledger — kept
 * apart so a movements list that fails costs the ledger and not the fields he
 * was typing into.
 */

import type { ApiItemCreate } from '@/types/api'
import type { ItemRecord } from '@/types/item'
import type {
  ApiAdjustmentCreate,
  ApiDiscontinueCreate,
  ApiItemDetail,
  ApiItemUpdate,
  ApiMovement,
} from '@/types/itemApi'
import { toItemRecord } from '@/utils/mapper/itemMapper'
import { apiGet, apiSend } from './http'

/** `GET /items/{id}`. An archived item still answers; `archivedAt` says so. */
export async function fetchItem(id: number, signal?: AbortSignal): Promise<ItemRecord> {
  return toItemRecord(await apiGet<ApiItemDetail>(`/items/${id}`, undefined, signal))
}

/**
 * `GET /items/{id}/movements` — the full ledger, newest first.
 *
 * Left as wire rows: a row's balance is anchored on the item's `stock_on_hand`,
 * so the mapping needs the item beside it. `toItemDerived` does that once both
 * have arrived.
 */
export async function fetchItemMovements(id: number, signal?: AbortSignal): Promise<ApiMovement[]> {
  return apiGet<ApiMovement[]>(`/items/${id}/movements`, undefined, signal)
}

/**
 * `POST /items`. Every field is optional on the wire, so this serves both callers
 * it has: the create screen, which sends what he filled in, and the shipment
 * builder, which sends a name alone to turn a line into a stub item.
 */
export async function createItem(body: ApiItemCreate): Promise<ItemRecord> {
  return toItemRecord(await apiSend<ApiItemDetail>('POST', '/items', body))
}

/** `PATCH /items/{id}`. The answer re-derives cost, price and stock. */
export async function updateItem(id: number, body: ApiItemUpdate): Promise<ItemRecord> {
  return toItemRecord(await apiSend<ApiItemDetail>('PATCH', `/items/${id}`, body))
}

/**
 * `DELETE /items/{id}` — the soft delete the Archive dialog promises: it stamps
 * `archived_at`, and the row stays reachable through `GET /items?archived=true`.
 */
export async function archiveItem(id: number): Promise<ItemRecord> {
  return toItemRecord(await apiSend<ApiItemDetail>('DELETE', `/items/${id}`))
}

/** `POST /items/{id}/adjustments`. Appends a movement and returns it. */
export async function createAdjustment(
  id: number,
  body: ApiAdjustmentCreate,
): Promise<ApiMovement> {
  return apiSend<ApiMovement>('POST', `/items/${id}/adjustments`, body)
}

/**
 * `POST /items/{id}/discontinue` — the state between active and archived. No UI
 * yet; here because it is part of the item's surface.
 */
export async function discontinueItem(
  id: number,
  body: ApiDiscontinueCreate,
): Promise<ItemRecord> {
  return toItemRecord(await apiSend<ApiItemDetail>('POST', `/items/${id}/discontinue`, body))
}

/** `POST /items/{id}/un-discontinue`. **Not** idempotent — a second call is 409. */
export async function unDiscontinueItem(id: number): Promise<ItemRecord> {
  return toItemRecord(await apiSend<ApiItemDetail>('POST', `/items/${id}/un-discontinue`))
}
