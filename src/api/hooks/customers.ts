import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  fetchContactLogs,
  fetchCustomer,
  fetchCustomers,
  fetchDormancyRule,
  fetchHouses,
} from '@/api/customers'
import { fetchRemovalFigures } from '@/api/customerRemoval'

export const customerKeys = {
  all: ['customers'] as const,
  list: () => [...customerKeys.all, 'list'] as const,
  detail: (id: number) => [...customerKeys.all, 'detail', id] as const,
  contactLogs: (id: number) => [...customerKeys.all, 'contact-logs', id] as const,
  houses: (id: number) => [...customerKeys.all, 'houses', id] as const,
  removalFigures: (id: number) => [...customerKeys.all, 'removal-figures', id] as const,
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

/**
 * One customer. Idle until there is an id to ask about: a caller that reads the
 * id off another record passes `0` while that record is still in flight, and
 * `GET /customers/0` is a request that cannot succeed. Ids are
 * `exclusiveMinimum: 0` on the wire, so zero is never a customer.
 */
export function useCustomer(id: MaybeRefOrGetter<number>) {
  const customerId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => customerKeys.detail(customerId.value)),
    queryFn: ({ signal }) => fetchCustomer(customerId.value, signal),
    enabled: computed(() => customerId.value > 0),
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
 * What her two exits would cost — her quotes and her jobs, counted.
 *
 * Its own query, and the one on this screen whose failure has to be visible:
 * every other read losing costs a column, but a removal band showing nothing
 * where `2 quotes, 1 job` belongs would understate an irreversible act. The
 * view keeps both exits shut until this has answered.
 */
export function useRemovalFigures(id: MaybeRefOrGetter<number>) {
  const customerId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => customerKeys.removalFigures(customerId.value)),
    queryFn: ({ signal }) => fetchRemovalFigures(customerId.value, signal),
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
