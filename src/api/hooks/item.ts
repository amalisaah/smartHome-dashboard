import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  archiveItem,
  clearPriceOverride,
  createAdjustment,
  discontinueItem,
  fetchItem,
  fetchItemMovements,
  setPriceOverride,
  unDiscontinueItem,
  updateItem,
} from '@/api/item'
import { catalogueKeys } from '@/api/hooks/catalogue'
import type { ApiAdjustmentCreate, ApiItemUpdate } from '@/types/itemApi'

/**
 * Thin hooks over `@/api/item` — one per endpoint, no composition. The screen
 * holds two reads and picks what to do when either fails; `useItemDetail` turns
 * them into what the columns render.
 */

export const itemKeys = {
  all: ['item'] as const,
  detail: (id: number) => [...itemKeys.all, 'detail', id] as const,
  movements: (id: number) => [...itemKeys.all, 'movements', id] as const,
}

/**
 * `GET /items/{id}`. Reactive in `id`, so the phone's Edit route and the detail
 * screen share the cache entry and navigating between them paints from it.
 */
export function useItem(id: MaybeRefOrGetter<number>) {
  const itemId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => itemKeys.detail(itemId.value)),
    queryFn: ({ signal }) => fetchItem(itemId.value, signal),
  })
}

/**
 * `GET /items/{id}/movements`. Its own query, so a ledger that fails leaves the
 * fields and the derived cards on screen — the movements card is the only thing
 * that goes.
 */
export function useItemMovements(id: MaybeRefOrGetter<number>) {
  const itemId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => itemKeys.movements(itemId.value)),
    queryFn: ({ signal }) => fetchItemMovements(itemId.value, signal),
  })
}

/**
 * The catalogue is in here because this item is a row on it: a rename moves its
 * name, a group change moves its label and its price, and an override moves the
 * figure in its Sell column — none of that visible from this screen.
 */
function useItemWriteInvalidation() {
  const queryClient = useQueryClient()

  return async (id: number, options?: { stockMoved?: boolean }) => {
    await queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) })
    if (options?.stockMoved) {
      await queryClient.invalidateQueries({ queryKey: itemKeys.movements(id) })
    }
    await queryClient.invalidateQueries({ queryKey: catalogueKeys.all })
  }
}

export interface ItemUpdateVariables {
  id: number
  body: ApiItemUpdate
}

export interface PriceOverrideVariables {
  id: number
  pesewas: number
}

/**
 * `PATCH /items/{id}` — the save-on-blur write. The response is the whole item
 * with its cost, price and stock freshly derived, so it is written straight into
 * the cache: the derived column moves the moment an override lands rather than
 * after a round trip it already made.
 *
 * Stock cannot move through a `PATCH`, so the ledger is left alone.
 */
export function useUpdateItem() {
  const queryClient = useQueryClient()
  const invalidate = useItemWriteInvalidation()

  return useMutation({
    mutationFn: ({ id, body }: ItemUpdateVariables) => updateItem(id, body),
    onSuccess: async (record, { id }) => {
      queryClient.setQueryData(itemKeys.detail(id), record)
      await invalidate(id)
    },
  })
}

/**
 * The fixed price that beats the group markup. Its own mutation rather than a
 * field on `useUpdateItem`, because the price is the one thing on this screen
 * with two states and the writes for them are not symmetrical — see below.
 */
export function useSetPriceOverride() {
  const queryClient = useQueryClient()
  const invalidate = useItemWriteInvalidation()

  return useMutation({
    mutationFn: ({ id, pesewas }: PriceOverrideVariables) => setPriceOverride(id, pesewas),
    onSuccess: async (record, { id }) => {
      queryClient.setQueryData(itemKeys.detail(id), record)
      await invalidate(id)
    },
  })
}

/**
 * `Back to group default`. **Fails today**, on purpose: the endpoint has no way
 * to clear an override, and the two things it would accept are a 400 and an
 * override of zero. The mutation's `error` carries a sentence the screen can
 * show, so the link reports that it cannot rather than appearing to work.
 *
 * It is wired as a mutation so that the day the API can do it, the change is
 * `clearPriceOverride`'s body and nothing else.
 */
export function useClearPriceOverride() {
  const invalidate = useItemWriteInvalidation()

  return useMutation({
    mutationFn: (id: number) => clearPriceOverride(id),
    onSuccess: async (_record, id) => invalidate(id),
  })
}

/**
 * `DELETE /items/{id}`. A soft delete, so the record comes back with
 * `archivedAt` stamped rather than disappearing — which is what lets the dialog
 * promise it can be restored.
 */
export function useArchiveItem() {
  const queryClient = useQueryClient()
  const invalidate = useItemWriteInvalidation()

  return useMutation({
    mutationFn: (id: number) => archiveItem(id),
    onSuccess: async (record, id) => {
      queryClient.setQueryData(itemKeys.detail(id), record)
      await invalidate(id)
    },
  })
}

export interface AdjustmentVariables {
  id: number
  body: ApiAdjustmentCreate
}

/**
 * `POST /items/{id}/adjustments` — the only way stock moves from this screen.
 *
 * It returns the new movement, not the item, so `stock_on_hand` and the balance
 * column are both a refetch away; the ledger and the item are invalidated
 * together, because a balance that disagreed with the dashed card above it would
 * be worse than a moment of staleness. The summary goes too — it counts units
 * and capital.
 */
export function useAdjustItemCount() {
  const queryClient = useQueryClient()
  const invalidate = useItemWriteInvalidation()

  return useMutation({
    mutationFn: ({ id, body }: AdjustmentVariables) => createAdjustment(id, body),
    onSuccess: async (_movement, { id }) => {
      await invalidate(id, { stockMoved: true })
      await queryClient.invalidateQueries({ queryKey: catalogueKeys.summary() })
    },
  })
}

export interface DiscontinueVariables {
  id: number
  reason: string
}

/** `POST /items/{id}/discontinue`. A blank reason is a 400. No UI yet. */
export function useDiscontinueItem() {
  const queryClient = useQueryClient()
  const invalidate = useItemWriteInvalidation()

  return useMutation({
    mutationFn: ({ id, reason }: DiscontinueVariables) => discontinueItem(id, { reason }),
    onSuccess: async (record, { id }) => {
      queryClient.setQueryData(itemKeys.detail(id), record)
      await invalidate(id)
    },
  })
}

/**
 * `POST /items/{id}/un-discontinue`. Not idempotent — an item that is not
 * discontinued answers 409, so a caller must not treat a second press as a
 * no-op. No UI yet.
 */
export function useUnDiscontinueItem() {
  const queryClient = useQueryClient()
  const invalidate = useItemWriteInvalidation()

  return useMutation({
    mutationFn: (id: number) => unDiscontinueItem(id),
    onSuccess: async (record, id) => {
      queryClient.setQueryData(itemKeys.detail(id), record)
      await invalidate(id)
    },
  })
}
