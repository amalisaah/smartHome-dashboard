import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  acceptQuote,
  declineQuote,
  fetchQuoteCustomerView,
  fetchQuoteOwnerView,
  fetchQuoteRooms,
} from '@/api/quotes'
import { fetchQuoteListRows } from '@/api/quoteList'

/**
 * The owner view, her view and the rooms are three keys, because they are three
 * reads with three fates: a failing room list must not blank the lines he is
 * looking at, and her view must be able to refetch on its own when he flips the
 * itemise switch.
 *
 * **These reads are deliberately quiet.** The quote screen is used standing in
 * somebody's hallway on mobile data, and the default policy — a 60s staleness
 * window plus a refetch every time the app regains focus — would re-read the
 * whole quote each time he glances at WhatsApp and comes back. Nothing moves a
 * quote but this screen, and this screen re-reads it itself the moment a submit
 * lands, so there is nothing a background refetch could learn.
 *
 * `customerView` carries `itemised` in the key. It is a different document, not
 * a filter applied to the same one — the server decides whether her quote names
 * the devices — so the two cache separately and flipping back is instant.
 */
export const quoteKeys = {
  all: ['quotes'] as const,
  listRows: () => [...quoteKeys.all, 'list-rows'] as const,
  ownerView: (id: number) => [...quoteKeys.all, 'owner-view', id] as const,
  customerView: (id: number, itemised: boolean) =>
    [...quoteKeys.all, 'customer-view', id, itemised] as const,
  rooms: (id: number) => [...quoteKeys.all, 'rooms', id] as const,
}

/**
 * The quote list's rows — block D.
 *
 * A separate key from `list()` because it is a different read: that one is the
 * quote records on their own, this one is quotes joined with the customers, the
 * houses and the jobs, which is what a row needs to name a household and point
 * at a job. See `@/api/quoteList` for why that join is four requests and not
 * 1 + 3N.
 *
 * Left on the default policy rather than the builder's `staleTime: Infinity`.
 * The builder is one document nothing else moves, so it caches hard; this is a
 * list whose days-waiting figures age by the day and whose rows move states
 * whenever he answers one. Coming back to this tab should show what is true
 * now.
 */
export function useQuoteListRows() {
  return useQuery({
    queryKey: quoteKeys.listRows(),
    queryFn: ({ signal }) => fetchQuoteListRows(signal),
  })
}

/** `GET /quotes/{id}/owner-view` — everything his view reads. */
export function useQuoteOwnerView(id: MaybeRefOrGetter<number>) {
  const quoteId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => quoteKeys.ownerView(quoteId.value)),
    queryFn: ({ signal }) => fetchQuoteOwnerView(quoteId.value, signal),
    // Submitting invalidates this key itself; nothing else changes a quote.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

/** `GET /quotes/{id}/rooms` — the house's rooms. They are never typed here. */
export function useQuoteRooms(id: MaybeRefOrGetter<number>) {
  const quoteId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => quoteKeys.rooms(quoteId.value)),
    queryFn: ({ signal }) => fetchQuoteRooms(quoteId.value, signal),
    // Rooms come from the house and are not editable here at all.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
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
 * Her document only moves when a submit moves it, and a submit invalidates this
 * key on its way out — so it is cached like the rest rather than re-fetched on
 * every flip. What keeps her total honest is that `Show her` submits first when
 * there is anything pending, not a request per tap.
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
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

// --- her answer -------------------------------------------------------------

/**
 * Both answers come back as the whole quote, so the cache is **set** rather than
 * invalidated: the screen behind the sheet is already showing the new status and
 * the agreed figure by the time the sheet closes, with no second read.
 *
 * The list rows are invalidated because the quote has just left Waiting, and
 * that list is the one screen whose whole job is saying who is still owed an
 * answer. Her view goes too: her document quotes a status.
 */
function useAnswerLanded() {
  const queryClient = useQueryClient()

  return async (id: number, view: Awaited<ReturnType<typeof declineQuote>>) => {
    queryClient.setQueryData(quoteKeys.ownerView(id), view)
    await queryClient.invalidateQueries({ queryKey: quoteKeys.listRows() })
    await queryClient.invalidateQueries({ queryKey: [...quoteKeys.all, 'customer-view', id] })
  }
}

export interface AcceptVariables {
  id: number
  /** What she agreed to, in pesewas. Always sent; never defaulted on the wire. */
  agreedTotalPesewas: number
}

/**
 * `POST /quotes/{id}/accept`.
 *
 * It is deliberately **not** retried. Accepting creates a job, and a request
 * that timed out on the way back may well have created one already — a silent
 * second attempt would be a second job under the same quote. A failure comes
 * back to the sheet, with the typed figure still in it, for him to press again.
 */
export function useAcceptQuote() {
  const landed = useAnswerLanded()

  return useMutation({
    mutationFn: ({ id, agreedTotalPesewas }: AcceptVariables) =>
      acceptQuote(id, agreedTotalPesewas),
    retry: false,
    onSuccess: async ({ view }, { id }) => landed(id, view),
  })
}

export interface DeclineVariables {
  id: number
  /** Null is the normal case. */
  reason: string | null
}

/** `POST /quotes/{id}/decline`. */
export function useDeclineQuote() {
  const landed = useAnswerLanded()

  return useMutation({
    mutationFn: ({ id, reason }: DeclineVariables) => declineQuote(id, reason),
    retry: false,
    onSuccess: async (view, { id }) => landed(id, view),
  })
}
