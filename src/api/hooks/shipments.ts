import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQueries, useQuery } from '@tanstack/vue-query'
import { fetchShipment, fetchShipmentPreview, fetchShipments } from '@/api/shipments'
import type { ApiShipmentDetail } from '@/types/api'

export const shipmentKeys = {
  all: ['shipments'] as const,
  list: () => [...shipmentKeys.all, 'list'] as const,
  detail: (id: number) => [...shipmentKeys.all, 'detail', id] as const,
  preview: (id: number) => [...shipmentKeys.all, 'preview', id] as const,
}

/** `GET /shipments`. Headers only — the figures per row come from the details. */
export function useShipments() {
  return useQuery({
    queryKey: shipmentKeys.list(),
    queryFn: ({ signal }) => fetchShipments(signal),
  })
}

/**
 * The detail behind every row, one query each.
 *
 * `GET /shipments` carries no totals, and the list's Units / Product / Shared
 * columns are the point of the screen, so each row fetches its own. They share
 * the detail cache with the builder, so opening a shipment after this is already
 * painted. The day the list endpoint can total them itself, this hook is what
 * goes — nothing else changes.
 */
export function useShipmentDetails(ids: MaybeRefOrGetter<number[]>) {
  return useQueries({
    queries: computed(() =>
      toValue(ids).map((id) => ({
        queryKey: shipmentKeys.detail(id),
        queryFn: ({ signal }: { signal?: AbortSignal }) => fetchShipment(id, signal),
      })),
    ),
    combine: (results) => {
      const byId = new Map<number, ApiShipmentDetail>()
      for (const result of results) {
        if (result.data) byId.set(result.data.id, result.data)
      }
      return { byId, pending: results.some((result) => result.isPending) }
    },
  })
}

/** `GET /shipments/{id}`. Disabled until there is an id — a new shipment has none. */
export function useShipment(id: MaybeRefOrGetter<number | null>) {
  const shipmentId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => shipmentKeys.detail(shipmentId.value ?? 0)),
    queryFn: ({ signal }) => fetchShipment(shipmentId.value as number, signal),
    enabled: computed(() => shipmentId.value !== null),
  })
}

/**
 * `GET /shipments/{id}/preview`. The allocation is worked out from what is
 * *saved*, so this is deliberately not cached long: the builder writes, then
 * the preview asks what those lines now cost.
 */
export function useShipmentPreview(id: MaybeRefOrGetter<number | null>) {
  const shipmentId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => shipmentKeys.preview(shipmentId.value ?? 0)),
    queryFn: ({ signal }) => fetchShipmentPreview(shipmentId.value as number, signal),
    enabled: computed(() => shipmentId.value !== null),
    staleTime: 0,
  })
}
