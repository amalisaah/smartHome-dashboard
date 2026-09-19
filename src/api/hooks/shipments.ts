import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchShipment, fetchShipmentPreview, fetchShipments } from '@/api/shipments'

export const shipmentKeys = {
  all: ['shipments'] as const,
  list: () => [...shipmentKeys.all, 'list'] as const,
  detail: (id: number) => [...shipmentKeys.all, 'detail', id] as const,
  preview: (id: number) => [...shipmentKeys.all, 'preview', id] as const,
}

/** `GET /shipments`. Each header carries its own Product and Misc totals. */
export function useShipments() {
  return useQuery({
    queryKey: shipmentKeys.list(),
    queryFn: ({ signal }) => fetchShipments(signal),
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
