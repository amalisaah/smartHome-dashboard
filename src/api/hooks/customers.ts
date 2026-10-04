import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  fetchContactLogs,
  fetchCustomer,
  fetchCustomers,
  fetchDormancyRule,
  fetchHouse,
  fetchHouses,
} from '@/api/customers'

export const customerKeys = {
  all: ['customers'] as const,
  list: () => [...customerKeys.all, 'list'] as const,
  detail: (id: number) => [...customerKeys.all, 'detail', id] as const,
  contactLogs: (id: number) => [...customerKeys.all, 'contact-logs', id] as const,
  houses: (id: number) => [...customerKeys.all, 'houses', id] as const,
  house: (id: number, houseId: number) => [...customerKeys.houses(id), houseId] as const,
}

/** A setting rather than a customer, so it is keyed as one. */
export const settingsKeys = {
  dormancy: () => ['settings', 'dormancy'] as const,
}

/**
 * The rows, most recently contacted first. Records rather than rows: the view
 * reads them against the dormancy rule.
 */
export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: ({ signal }) => fetchCustomers(signal),
  })
}

export function useCustomer(id: MaybeRefOrGetter<number>) {
  const customerId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => customerKeys.detail(customerId.value)),
    queryFn: ({ signal }) => fetchCustomer(customerId.value, signal),
  })
}

/**
 * Her contact history, most recent first as the endpoint answers. Its own query
 * beside `useCustomer`: a history that fails to load costs the history, and the
 * screen still says who she is and still offers both ways to remove her.
 */
export function useContactLogs(id: MaybeRefOrGetter<number>) {
  const customerId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => customerKeys.contactLogs(customerId.value)),
    queryFn: ({ signal }) => fetchContactLogs(customerId.value, signal),
  })
}

/**
 * Her houses, one request. Its own query for the same reason as the history:
 * losing it costs the list of houses and leaves the rest of her page standing.
 */
export function useCustomerHouses(id: MaybeRefOrGetter<number>) {
  const customerId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => customerKeys.houses(customerId.value)),
    queryFn: ({ signal }) => fetchHouses(customerId.value, signal),
  })
}

/**
 * One house of hers, for the house screens. Keyed under her houses so creating
 * one invalidates both the list and anything reading a single house out of it.
 */
export function useHouse(
  customerId: MaybeRefOrGetter<number>,
  houseId: MaybeRefOrGetter<number>,
) {
  const id = computed(() => toValue(customerId))
  const house = computed(() => toValue(houseId))

  return useQuery({
    queryKey: computed(() => customerKeys.house(id.value, house.value)),
    queryFn: ({ signal }) => fetchHouse(id.value, house.value, signal),
  })
}

/**
 * Its own query, so a screen that cannot read it still lists every customer —
 * it loses the countdown and the amber, not the rows.
 */
export function useDormancyRule() {
  return useQuery({
    queryKey: settingsKeys.dormancy(),
    queryFn: ({ signal }) => fetchDormancyRule(signal),
  })
}
