import { computed, ref, watch } from 'vue'
import { useCreateQuote, useRoomCounts, useQuoteStarters } from '@/api/hooks/newQuote'
import { useOnline } from './useOnline'
import {
  customerMatches,
  isQuotable,
  type NewQuoteCustomer,
  type NewQuoteHouse,
} from '@/types/newQuote'

/**
 * Starting a quote — the state behind G1 and G2.
 *
 * **Nothing here is saved.** There is no draft, no session key and no record of
 * any kind until he picks a house; cancelling at any point leaves exactly what
 * was there before, which is why this is a composable over a sheet rather than
 * a route with a form in it.
 *
 * The two devices share every rule but one. `skipSingleHouse` is the phone's:
 * a customer with exactly one quotable house has already answered step 2, so
 * tapping her name starts the quote. The laptop shows both columns at once, so
 * there is no step to skip — skipping there would make the right-hand column
 * flash and vanish.
 */
export interface NewQuoteOptions {
  /** The phone's rule. See above. */
  skipSingleHouse: boolean
  /** Where the created draft goes. Called with the id the server minted. */
  onCreated: (quoteId: number) => void
}

/** Which of the phone's two steps is on screen. The laptop shows both at once. */
export type NewQuoteStep = 'customer' | 'house'

export function useNewQuote(options: NewQuoteOptions) {
  const online = useOnline()

  const query = ref('')
  /** The customer whose houses are being read, and then shown. */
  const activeId = ref<number | null>(null)
  /**
   * The phone's step. Held rather than derived from `activeId`, because between
   * the tap and the room counts landing he is still on step 1 — with the row he
   * touched saying so — and only then does it become known whether step 2 has
   * anything left to ask.
   */
  const step = ref<NewQuoteStep>('customer')
  /** The create failed. Cleared the moment he presses a house again. */
  const failed = ref(false)

  const starters = useQuoteStarters()

  const customers = computed<NewQuoteCustomer[]>(() => starters.data.value ?? [])

  const matches = computed(() =>
    customers.value.filter((customer) => customerMatches(customer, query.value)),
  )

  const active = computed(() => customers.value.find((c) => c.id === activeId.value) ?? null)

  /** Her houses, read for their counts. Empty while nobody is picked. */
  const activeHouseIds = computed(() => active.value?.houses.map((house) => house.id) ?? [])

  const counts = useRoomCounts(activeId, activeHouseIds)

  /**
   * Her houses with their counts filled in. A house still carries `null` until
   * its count lands, which is what keeps `isQuotable` from vouching for a house
   * nobody has counted yet.
   */
  const houses = computed<NewQuoteHouse[]>(() => {
    const read = counts.data.value
    return (active.value?.houses ?? []).map((house) => ({
      ...house,
      roomCount: read?.get(house.id) ?? null,
    }))
  })

  /**
   * Whether her houses are still being counted. A customer with no houses is
   * never counting: there is nothing to ask about and the empty message is
   * already the whole answer.
   */
  const countingRooms = computed(
    () => active.value !== null && active.value.houses.length > 0 && counts.data.value === undefined,
  )

  const createQuote = useCreateQuote()

  /** Whether a draft is in flight. The house rows go inert while it is. */
  const creating = computed(() => createQuote.isPending.value)

  /**
   * He picks a customer.
   *
   * On the phone this is where the one-house rule is decided, and it cannot be
   * decided here: the counts have not been read yet. So the step stays on the
   * customer list — with her row reporting that it is reading — and the watcher
   * below finishes the job once they land.
   */
  function pickCustomer(id: number) {
    failed.value = false
    activeId.value = id
    if (!options.skipSingleHouse) return

    const customer = customers.value.find((c) => c.id === id)
    // No houses is a settled answer already: step 2 says so and offers the way
    // to add one. Nothing is being counted, so nothing is worth waiting for.
    step.value = customer && customer.houses.length === 0 ? 'house' : 'customer'
  }

  /**
   * The phone's skip, resolved the moment the counts are in. One quotable house
   * means step 2 would be a list of one with a single way out of it, so the tap
   * on her name is taken as the answer to both questions.
   */
  watch([countingRooms, houses], () => {
    if (!options.skipSingleHouse) return
    if (activeId.value === null || step.value === 'house') return
    if (countingRooms.value) return

    const [only] = houses.value
    if (houses.value.length === 1 && isQuotable(only)) create(only.id)
    else step.value = 'house'
  })

  /** Back to step 1. The search text stays: it is how he found her. */
  function backToCustomers() {
    activeId.value = null
    step.value = 'customer'
    failed.value = false
  }

  /**
   * Picking the house is what creates the quote, and the only write this flow
   * makes. A failure keeps the sheet exactly where it is — nothing was created,
   * so there is nothing to undo and the same house is still the answer.
   */
  function create(houseId: number) {
    if (activeId.value === null || !online.value || creating.value) return
    failed.value = false

    createQuote.mutate(
      { customerId: activeId.value, houseId },
      {
        onSuccess: ({ id }) => options.onCreated(id),
        onError: () => {
          failed.value = true
          // The skip watcher has already fired for this customer; the step has
          // to hold the houses so he can press one again.
          step.value = 'house'
        },
      },
    )
  }

  return {
    query,
    step,
    online,
    /** Nothing cached yet — a background refresh never re-skeletons the list. */
    loading: computed(() => starters.isPending.value),
    failedToLoad: computed(() => starters.isError.value && !customers.value.length),
    matches,
    active,
    houses,
    countingRooms,
    creating,
    failed,
    activeId: computed(() => activeId.value),
    pickCustomer,
    backToCustomers,
    create,
    retryLoad: () => starters.refetch(),
  }
}
