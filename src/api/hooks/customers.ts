import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchCustomer, fetchCustomers, fetchDormancyRule } from '@/api/customers'

export const customerKeys = {
  all: ['customers'] as const,
  list: () => [...customerKeys.all, 'list'] as const,
  detail: (id: number) => [...customerKeys.all, 'detail', id] as const,
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
 * Its own query, so a screen that cannot read it still lists every customer —
 * it loses the countdown and the amber, not the rows.
 */
export function useDormancyRule() {
  return useQuery({
    queryKey: settingsKeys.dormancy(),
    queryFn: ({ signal }) => fetchDormancyRule(signal),
  })
}
