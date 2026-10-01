import {
  computed,
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import {
  DEFAULT_FILTER,
  isCustomerFilterKey,
  phoneDigits,
  type CustomerFilterDef,
  type CustomerFilterKey,
  type CustomerLogResult,
  type CustomerRow,
  type CustomerSort,
  type CustomerSortColumn,
  type LoggedContact,
} from '@/types/customers'
import { sessionValue } from '@/utils/storage'

const SEARCH_DEBOUNCE_MS = 150

/** The filter he last worked in, for the tab's lifetime. */
const storedFilter = sessionValue<CustomerFilterKey>('customers:filter', isCustomerFilterKey)

/** `14:02` — the stamp beside the ✓. */
const CLOCK = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/**
 * How the footer says the active ordering. The handoff names the two a filter
 * opens in; the reversed forms are invented, since a header that reverses has
 * to be able to say so.
 */
const SORT_PHRASE: Record<CustomerSortColumn, Record<'asc' | 'desc', string>> = {
  quiet: { desc: 'longest quiet first', asc: 'shortest quiet first' },
  name: { asc: 'by name', desc: 'by name, reversed' },
}

/**
 * Search, filter, sort and the per-row log state. It owns no requests: the view
 * fetches and hands the rows in, so a refetch arrives as new input rather than
 * as a second source of truth.
 *
 * It decides nothing about a customer — only which rows are on screen, in what
 * order, and what has been logged since he opened the list.
 */
export function useCustomerList(
  rowsSource: MaybeRefOrGetter<CustomerRow[]>,
  filtersSource: MaybeRefOrGetter<CustomerFilterDef[]>,
  options: { initialFilter?: CustomerFilterKey } = {},
) {
  const rows = computed(() => toValue(rowsSource))
  const filters = computed(() => toValue(filtersSource))

  const query = ref('')
  const debouncedQuery = ref('')
  const filter = ref<CustomerFilterKey>(
    storedFilter.readOr(options.initialFilter ?? DEFAULT_FILTER),
  )

  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  onBeforeUnmount(() => clearTimeout(debounceTimer))

  watch(query, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => (debouncedQuery.value = value), SEARCH_DEBOUNCE_MS)
  })

  watch(filter, (value) => storedFilter.write(value))

  // --- search ---------------------------------------------------------------

  const needle = computed(() => debouncedQuery.value.trim().toLowerCase())
  const searching = computed(() => needle.value !== '')

  const needleDigits = computed(() => phoneDigits(needle.value))

  const matchesQuery = (row: CustomerRow) => {
    if (!searching.value) return true
    if (row.name.toLowerCase().includes(needle.value)) return true
    // Spaces are how a number is written, not part of it: digits against digits.
    return needleDigits.value !== '' && phoneDigits(row.phone).includes(needleDigits.value)
  }

  // --- filter and sort ------------------------------------------------------

  const activeFilter = computed(
    () => filters.value.find((def) => def.key === filter.value) ?? null,
  )

  /**
   * A query reaches everyone. A filter that hides the person he is looking for
   * is a bug, so while there is a query the filter is held but not applied —
   * and the chips render inactive to say so.
   */
  const matchedRows = computed(() =>
    searching.value
      ? rows.value.filter(matchesQuery)
      : rows.value.filter((row) => row.filters.includes(filter.value)),
  )

  const sort = ref<CustomerSort>({ column: 'quiet', direction: 'desc' })

  // A filter opens in the ordering it is worked in. Set when the filter changes
  // and when the defs land, so a click on a header holds.
  watch(
    [activeFilter, () => filter.value],
    ([def]) => {
      if (def) sort.value = { ...def.defaultSort }
    },
    { immediate: true },
  )

  const compareName = (a: CustomerRow, b: CustomerRow, direction: 'asc' | 'desc') =>
    direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)

  const sortedRows = computed(() => {
    const { column, direction } = sort.value
    // A copy: sorting `rows` in place would reorder the query cache's array.
    return [...matchedRows.value].sort((a, b) => {
      if (column === 'quiet') {
        const gap =
          direction === 'asc'
            ? a.quietForDays - b.quietForDays
            : b.quietForDays - a.quietForDays
        // A fixed tie-break, so the list does not shuffle between renders.
        return gap || compareName(a, b, 'asc')
      }
      return compareName(a, b, direction)
    })
  })

  // --- the order he is clicking down ---------------------------------------

  /**
   * The order on screen when the first contact of this pass was logged. A log
   * changes the sort key — `52 d` becomes `today` — and a row that moves takes
   * the next click with it, so the order is pinned until he changes filter,
   * search or sort himself.
   */
  const frozenOrder = ref<number[] | null>(null)

  watch([filter, debouncedQuery, sort], () => (frozenOrder.value = null))

  const visibleRows = computed(() => {
    const frozen = frozenOrder.value
    if (!frozen) return sortedRows.value

    const rank = new Map(frozen.map((id, index) => [id, index]))
    // A row the frozen pass never saw sorts after the pinned ones, not away.
    return [...sortedRows.value].sort(
      (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
    )
  })

  /** D2's list: the same search and filter, in the order the data layer gave. */
  const phoneRows = computed(() => matchedRows.value)

  // --- logging --------------------------------------------------------------

  const logged = ref(new Map<number, LoggedContact>())

  const loggedFor = (id: number) => logged.value.get(id) ?? null
  const loggedTodayCount = computed(() => logged.value.size)

  /** Closes the open note as state 3. */
  function closeOpenNotes() {
    for (const [id, entry] of logged.value) {
      if (entry.noteOpen) logged.value.set(id, { ...entry, noteOpen: false })
    }
  }

  /**
   * The contact is recorded on the click. Nothing waits on the network: the ✓
   * and the note field are up first, and only a status change has anything left
   * to render by the time the request answers.
   */
  function logSpoke(row: CustomerRow, send: (id: number) => Promise<CustomerLogResult | null>) {
    closeOpenNotes()

    if (frozenOrder.value === null) {
      frozenOrder.value = visibleRows.value.map((visible) => visible.id)
    }

    logged.value.set(row.id, {
      time: CLOCK.format(new Date()),
      note: '',
      noteOpen: true,
      result: null,
    })

    send(row.id)
      .then((result) => {
        // Dropped if it was undone while in flight.
        const entry = logged.value.get(row.id)
        if (entry) logged.value.set(row.id, { ...entry, result })
      })
      // A failed round trip is no reason to take the ✓ back.
      .catch(() => {})
  }

  function setNote(id: number, note: string) {
    const entry = logged.value.get(id)
    if (entry) logged.value.set(id, { ...entry, note })
  }

  /** Enter, Escape or blur: leaving is not discarding. */
  function closeNote(id: number) {
    const entry = logged.value.get(id)
    if (entry) logged.value.set(id, { ...entry, noteOpen: false })
  }

  /** Back to state 1, and the note goes with it. */
  function undoLog(id: number) {
    logged.value.delete(id)
  }

  // --- the strings the footer says -----------------------------------------

  const sortPhrase = computed(() => SORT_PHRASE[sort.value.column][sort.value.direction])

  const footerSummary = computed(() => {
    if (searching.value) {
      return `${visibleRows.value.length} of ${rows.value.length} match · searching everyone`
    }

    const label = activeFilter.value?.label ?? ''
    const base = `${visibleRows.value.length} ${label} · ${sortPhrase.value}`
    return loggedTodayCount.value > 0
      ? `${base} · ${loggedTodayCount.value} logged today`
      : base
  })

  /** D2's footer. */
  const phoneFooter = computed(
    () => `${phoneRows.value.length} of ${rows.value.length} · tap to open her house`,
  )

  const phoneSectionLabel = computed(() =>
    searching.value ? 'Matches · everyone' : 'Most recent contact first',
  )

  // --- filter and sort controls --------------------------------------------

  /** Picking a filter is choosing a list to work, so it drops the search. */
  function selectFilter(key: CustomerFilterKey) {
    query.value = ''
    debouncedQuery.value = ''
    clearTimeout(debounceTimer)
    filter.value = key
  }

  function toggleSort(column: CustomerSortColumn) {
    if (sort.value.column === column) {
      sort.value = {
        column,
        direction: sort.value.direction === 'asc' ? 'desc' : 'asc',
      }
      return
    }
    // A new column opens in the direction it is read in.
    sort.value = { column, direction: column === 'name' ? 'asc' : 'desc' }
  }

  return {
    query,
    debouncedQuery,
    searching,
    filter,
    activeFilter,
    selectFilter,
    sort,
    toggleSort,
    visibleRows,
    phoneRows,
    logged,
    loggedFor,
    loggedTodayCount,
    logSpoke,
    setNote,
    closeNote,
    closeOpenNotes,
    undoLog,
    footerSummary,
    phoneFooter,
    phoneSectionLabel,
    totalCount: computed(() => rows.value.length),
  }
}
