import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  fetchQuoteCustomerView,
  fetchQuoteOwnerView,
  fetchQuoteRooms,
  fetchQuotes,
} from '@/api/quotes'

/**
 * The owner view, her view and the rooms are three keys, because they are three
 * reads with three fates: a failing room list must not blank the lines he is
 * looking at, and her view must be able to refetch on its own when he flips the
 * itemise switch.
 *
 * `customerView` carries `itemised` in the key. It is a different document, not
 * a filter applied to the same one — the server decides whether her quote names
 * the devices — so the two cache separately and flipping back is instant.
 */
export const quoteKeys = {
  all: ['quotes'] as const,
  list: () => [...quoteKeys.all, 'list'] as const,
  ownerView: (id: number) => [...quoteKeys.all, 'owner-view', id] as const,
  customerView: (id: number, itemised: boolean) =>
    [...quoteKeys.all, 'customer-view', id, itemised] as const,
  rooms: (id: number) => [...quoteKeys.all, 'rooms', id] as const,
}

/** `GET /quotes` — the stub list's way to a real quote. */
export function useQuotes() {
  return useQuery({
    queryKey: quoteKeys.list(),
    queryFn: ({ signal }) => fetchQuotes(signal),
  })
}

/** `GET /quotes/{id}/owner-view` — everything his view reads. */
export function useQuoteOwnerView(id: MaybeRefOrGetter<number>) {
  const quoteId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => quoteKeys.ownerView(quoteId.value)),
    queryFn: ({ signal }) => fetchQuoteOwnerView(quoteId.value, signal),
  })
}

/** `GET /quotes/{id}/rooms` — the house's rooms. They are never typed here. */
export function useQuoteRooms(id: MaybeRefOrGetter<number>) {
  const quoteId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => quoteKeys.rooms(quoteId.value)),
    queryFn: ({ signal }) => fetchQuoteRooms(quoteId.value, signal),
  })
}

/**
 * `GET /quotes/{id}/customer-view`.
 *
 * Disabled until the three cost-free facts her header needs are known — the
 * date, the surname and the room count — because a half-built her view would
 * show "For the  home". They are passed in rather than read here so that the
 * only owner-side value that can reach her screen is a date string, and it has
 * to be handed over deliberately.
 *
 * `staleTime: 0`: he turns the phone round seconds after changing a figure, and
 * a stale total on her screen is the one thing this view may not show.
 */
export function useQuoteCustomerView(
  id: MaybeRefOrGetter<number>,
  itemised: MaybeRefOrGetter<boolean>,
  facts: MaybeRefOrGetter<{ createdAt: string; surname: string; roomCount: number } | null>,
) {
  const quoteId = computed(() => toValue(id))
  const on = computed(() => toValue(itemised))
  const known = computed(() => toValue(facts))

  return useQuery({
    queryKey: computed(() => quoteKeys.customerView(quoteId.value, on.value)),
    queryFn: ({ signal }) =>
      fetchQuoteCustomerView(
        quoteId.value,
        on.value,
        known.value as { createdAt: string; surname: string; roomCount: number },
        signal,
      ),
    enabled: computed(() => known.value !== null),
    staleTime: 0,
  })
}
