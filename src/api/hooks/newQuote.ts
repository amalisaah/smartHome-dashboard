import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { createQuote, fetchQuoteStarters, fetchRoomCounts } from '@/api/newQuote'
import { quoteKeys } from './quotes'

/**
 * Block G's three calls.
 *
 * The starters and the room counts are separate keys because they are separate
 * reads with separate fates: the counts for one customer failing must not take
 * the list of customers down with them, and the counts cache **per customer**,
 * so changing his mind on the laptop and changing it back costs nothing.
 */
export const newQuoteKeys = {
  all: ['new-quote'] as const,
  starters: () => [...newQuoteKeys.all, 'starters'] as const,
  roomCounts: (customerId: number) => [...newQuoteKeys.all, 'room-counts', customerId] as const,
}

/**
 * Every quotable customer with her houses — the picker's list.
 *
 * Left on the default policy. The picker opens over a list he may have had up
 * for an hour, and a customer added on another device in the meantime is
 * exactly who he is standing with.
 */
export function useQuoteStarters() {
  return useQuery({
    queryKey: newQuoteKeys.starters(),
    queryFn: ({ signal }) => fetchQuoteStarters(signal),
  })
}

/**
 * Room counts for one customer's houses, read on the tap.
 *
 * Idle until a customer is picked — `0` is never a customer — and until there
 * is at least one house to ask about, because a customer with none has nothing
 * to count and the empty message is already the answer.
 *
 * Cached hard: rooms come from the house and nothing in this flow changes them.
 * The `houseIds` are deliberately **not** in the key — they are a function of
 * the customer, and putting them there would re-read the same counts whenever
 * the starters list refreshed and handed back an equal array.
 */
export function useRoomCounts(
  customerId: MaybeRefOrGetter<number | null>,
  houseIds: MaybeRefOrGetter<number[]>,
) {
  const id = computed(() => toValue(customerId))
  const ids = computed(() => toValue(houseIds))

  return useQuery({
    queryKey: computed(() => newQuoteKeys.roomCounts(id.value ?? 0)),
    queryFn: ({ signal }) => fetchRoomCounts(ids.value, signal),
    enabled: computed(() => id.value !== null && ids.value.length > 0),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export interface CreateQuoteVariables {
  customerId: number
  houseId: number
}

/**
 * `POST /quotes`.
 *
 * **Not retried.** A request that timed out on the way back may well have
 * created the draft already, and a silent second attempt would leave two empty
 * quotes against the same house with no way to tell which one he is about to
 * open. A failure comes back to the sheet, which stays on the house step with
 * the one house to press again.
 *
 * The list rows are invalidated on the way out because the draft belongs under
 * D's Drafts the moment he lands — and he may well come straight back.
 */
export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ customerId, houseId }: CreateQuoteVariables) =>
      createQuote(customerId, houseId),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: quoteKeys.listRows() })
    },
  })
}
