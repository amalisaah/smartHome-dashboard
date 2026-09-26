import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  archiveItem,
  createAdjustment,
  createItem,
  discontinueItem,
  fetchItem,
  fetchItemMovements,
  unDiscontinueItem,
  updateItem,
} from '@/api/item'
import { catalogueKeys } from '@/api/hooks/catalogue'
import type { ApiItemCreate } from '@/types/api'
import type { ApiAdjustmentCreate, ApiItemUpdate } from '@/types/itemApi'

/** Thin hooks over `@/api/item` — one per endpoint, no composition. */

export const itemKeys = {
  all: ['item'] as const,
  detail: (id: number) => [...itemKeys.all, 'detail', id] as const,
  movements: (id: number) => [...itemKeys.all, 'movements', id] as const,
}

/** Reactive in `id`, so the detail and Edit routes share one cache entry. */
export function useItem(id: MaybeRefOrGetter<number>) {
  const itemId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => itemKeys.detail(itemId.value)),
    queryFn: ({ signal }) => fetchItem(itemId.value, signal),
  })
}

/** Its own query, so a ledger that fails costs only the movements card. */
export function useItemMovements(id: MaybeRefOrGetter<number>) {
  const itemId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => itemKeys.movements(itemId.value)),
    queryFn: ({ signal }) => fetchItemMovements(itemId.value, signal),
  })
}

/**
 * The catalogue is in here because this item is a row on it — a rename, a group
 * change or an override all move that row, none of it visible from here.
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

/**
 * `POST /items`. The answer is the whole item, cached under its brand-new id so
 * the screen this redirects to opens on the record rather than on `Loading…`.
 */
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: ApiItemCreate) => createItem(body),
    onSuccess: async (record) => {
      queryClient.setQueryData(itemKeys.detail(record.id), record)
      await queryClient.invalidateQueries({ queryKey: catalogueKeys.all })
    },
  })
}

export interface ItemUpdateVariables {
  id: number
  body: ApiItemUpdate
}

/**
 * Every field, and the price override with them — one write. The response is the
 * whole item, re-derived, so it goes straight into the cache. Stock cannot move
 * through a `PATCH`, so the ledger is left alone.
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

/** Soft: the record comes back with `archivedAt` stamped, so it can be restored. */
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
 * The only way stock moves from here. It returns the movement, not the item, so
 * the ledger and the item are invalidated together: a balance disagreeing with
 * the card above it is worse than a moment of staleness. The summary counts units.
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

/** A blank reason is a 400. No UI yet. */
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

/** Not idempotent — a second press is a 409, not a no-op. No UI yet. */
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
