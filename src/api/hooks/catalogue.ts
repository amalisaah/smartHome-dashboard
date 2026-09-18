import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  fetchGroups,
  fetchItems,
  fetchSummary,
  type CatalogueGroupsQuery,
  type CatalogueItemsQuery,
} from '@/api/catalogue'

export const catalogueKeys = {
  all: ['catalogue'] as const,
  items: () => [...catalogueKeys.all, 'items'] as const,
  groups: () => [...catalogueKeys.all, 'groups'] as const,
  summary: () => [...catalogueKeys.all, 'summary'] as const,
}

/**
 * `GET /items`. The query is part of the key, so each filter combination caches
 * separately and a reactive query refetches when it changes; `catalogueKeys.items()`
 * still invalidates all of them.
 */
export function useCatalogueItems(query: MaybeRefOrGetter<CatalogueItemsQuery> = {}) {
  const params = computed(() => toValue(query))

  return useQuery({
    queryKey: computed(() => [...catalogueKeys.items(), params.value]),
    queryFn: ({ signal }) => fetchItems(params.value, signal),
  })
}

/** `GET /groups`. Every active group, already in `sort_order` — the filter's options. */
export function useCatalogueGroups(query: MaybeRefOrGetter<CatalogueGroupsQuery> = {}) {
  const params = computed(() => toValue(query))

  return useQuery({
    queryKey: computed(() => [...catalogueKeys.groups(), params.value]),
    queryFn: ({ signal }) => fetchGroups(params.value, signal),
  })
}

/** `GET /summary`. The nine dashboard numbers, including the two chip counts. */
export function useCatalogueSummary() {
  return useQuery({
    queryKey: catalogueKeys.summary(),
    queryFn: ({ signal }) => fetchSummary(signal),
  })
}
