import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  fetchContactLogs,
  fetchCustomer,
  fetchCustomers,
  fetchDormancyRule,
} from '@/api/customers'

export const customerKeys = {
  all: ['customers'] as const,
  list: () => [...customerKeys.all, 'list'] as const,
  detail: (id: number) => [...customerKeys.all, 'detail', id] as const,
  contactLogs: (id: number) => [...customerKeys.all, 'contact-logs', id] as const,
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
 * Its own query, so a screen that cannot read it still lists every customer —
 * it loses the countdown and the amber, not the rows.
 */
export function useDormancyRule() {
  return useQuery({
    queryKey: settingsKeys.dormancy(),
    queryFn: ({ signal }) => fetchDormancyRule(signal),
  })
}
