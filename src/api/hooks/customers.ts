import { useQuery } from '@tanstack/vue-query'
import { fetchCustomerFilters, fetchCustomers } from '@/api/customers'

export const customerKeys = {
  all: ['customers'] as const,
  list: () => [...customerKeys.all, 'list'] as const,
  filters: () => [...customerKeys.all, 'filters'] as const,
}

/**
 * The rows, in the data layer's order. Unpaginated, so the list is worked over
 * in memory — that is what lets a keystroke re-filter without a round trip, and
 * lets search cover everyone while a filter is active.
 */
export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => fetchCustomers(),
  })
}

/** Its own query, so a counts failure costs the chips their numbers, not the rows. */
export function useCustomerFilters() {
  return useQuery({
    queryKey: customerKeys.filters(),
    queryFn: () => fetchCustomerFilters(),
  })
}
