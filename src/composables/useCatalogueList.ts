import { computed, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import {
  ALL_GROUPS,
  isLowStock,
  marginPercent,
  type CatalogueGroupRef,
  type CatalogueItem,
  type GroupFilter,
  type SortColumn,
  type SortDirection,
} from '@/types/catalogue'
import { isString, sessionValue } from '@/utils/storage'

const SEARCH_DEBOUNCE_MS = 150

/**
 * The group he last filtered to, for the tab's lifetime. A slug rather than an
 * id, and validated only as a string here: whether it still names a live group
 * cannot be known until `GET /groups` lands, which the watcher below checks.
 */
const storedGroupFilter = sessionValue<GroupFilter>('catalogue:group-filter', isString)

export const SORT_COLUMN_LABELS: Record<SortColumn, string> = {
  name: 'name',
  group: 'group',
  stock: 'stock',
  landed: 'landed',
  sell: 'sell',
  margin: 'margin',
  lead: 'lead',
}

const displayName = (item: CatalogueItem) => item.name ?? 'Untitled item'

/** Nulls sort last whichever way the column is pointing. */
function compareNumeric(a: number | null, b: number | null, direction: SortDirection): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === 'asc' ? a - b : b - a
}

function compareText(a: string | null, b: string | null, direction: SortDirection): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
}

/**
 * Search, filter and sort over a catalogue that is already loaded. It owns no
 * requests: the view fetches with the hooks in `@/api/hooks/catalogue` and hands
 * the rows in, so a refetch flows through here as new input rather than as a
 * second source of truth.
 *
 * All three are local because `GET /items` is unpaginated — that is what lets a
 * keystroke re-filter without a round trip, and lets a row say which keyword
 * matched. `/items` does take `q`, `group_id`, `low_stock` and `sort`, so the day
 * the list paginates, this is the file that starts passing them instead.
 */
export function useCatalogueList(
  itemsSource: MaybeRefOrGetter<CatalogueItem[]>,
  groupsSource: MaybeRefOrGetter<CatalogueGroupRef[]>,
) {
  const items = computed(() => toValue(itemsSource))
  const groups = computed(() => toValue(groupsSource))

  const query = ref('')
  const debouncedQuery = ref('')
  const groupFilter = ref<GroupFilter>(storedGroupFilter.readOr(ALL_GROUPS))
  const lowStockOnly = ref(false)
  const attentionOnly = ref(false)
  const sortColumn = ref<SortColumn>('name')
  const sortDirection = ref<SortDirection>('asc')

  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  onBeforeUnmount(() => clearTimeout(debounceTimer))

  watch(query, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => (debouncedQuery.value = value), SEARCH_DEBOUNCE_MS)
  })

  // Persisting the group is a convenience, never a requirement — the store
  // swallows a browser that refuses it.
  watch(groupFilter, (value) => storedGroupFilter.write(value))

  // The stored slug came from a previous session, and a group can have been
  // renamed away or archived since. Checked when the groups land, not before —
  // an empty list is "not fetched yet", not "that group is gone".
  watch(groups, (list) => {
    if (list.length === 0 || groupFilter.value === ALL_GROUPS) return
    if (!list.some((group) => group.slug === groupFilter.value)) groupFilter.value = ALL_GROUPS
  })

  // --- search --------------------------------------------------------------
  const normalisedQuery = computed(() => debouncedQuery.value.trim().toLowerCase())

  const nameMatches = (item: CatalogueItem, needle: string) =>
    displayName(item).toLowerCase().includes(needle)

  /** The keyword that pulled a row in when its name did not match. */
  function matchedKeyword(item: CatalogueItem): string | null {
    const needle = normalisedQuery.value
    if (!needle || nameMatches(item, needle)) return null
    return item.keywords.find((keyword) => keyword.toLowerCase().includes(needle)) ?? null
  }

  const matchesQuery = (item: CatalogueItem) => {
    const needle = normalisedQuery.value
    if (!needle) return true
    return (
      nameMatches(item, needle) ||
      item.keywords.some((keyword) => keyword.toLowerCase().includes(needle))
    )
  }

  // --- filtering and sorting ----------------------------------------------
  const visibleItems = computed(() => {
    const filtered = items.value.filter((item) => {
      if (!matchesQuery(item)) return false
      if (groupFilter.value !== ALL_GROUPS && item.group?.slug !== groupFilter.value) return false
      if (lowStockOnly.value && !isLowStock(item)) return false
      if (attentionOnly.value && !item.needsAttention) return false
      return true
    })

    const direction = sortDirection.value
    // A copy, because `items` is now query cache data — sorting in place would
    // reorder the cached array every keystroke.
    return filtered.sort((a, b) => {
      switch (sortColumn.value) {
        case 'group':
          return (
            compareText(a.group?.name ?? null, b.group?.name ?? null, direction) ||
            compareText(displayName(a), displayName(b), 'asc')
          )
        case 'stock':
          return compareNumeric(a.stock, b.stock, direction)
        case 'landed':
          return compareNumeric(a.landedCostPesewas, b.landedCostPesewas, direction)
        case 'sell':
          return compareNumeric(a.sellPricePesewas, b.sellPricePesewas, direction)
        case 'margin':
          return compareNumeric(marginPercent(a), marginPercent(b), direction)
        case 'lead':
          return compareNumeric(a.leadDays, b.leadDays, direction)
        default:
          return compareText(displayName(a), displayName(b), direction)
      }
    })
  })

  function toggleSort(column: SortColumn) {
    if (sortColumn.value === column) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      return
    }
    sortColumn.value = column
    sortDirection.value = 'asc'
  }

  // --- counts --------------------------------------------------------------
  // Still whole-catalogue figures: `GET /items` is unpaginated and `GET /groups`
  // returns every group. They become page counts the day the list paginates —
  // a `total_items` on the summary is the fix at that point.
  const totalCount = computed(() => items.value.length)
  const groupCount = computed(() => groups.value.length)

  const isFiltered = computed(
    () =>
      normalisedQuery.value !== '' ||
      groupFilter.value !== ALL_GROUPS ||
      lowStockOnly.value ||
      attentionOnly.value,
  )

  return {
    query,
    debouncedQuery,
    groupFilter,
    lowStockOnly,
    attentionOnly,
    sortColumn,
    sortDirection,
    visibleItems,
    toggleSort,
    matchedKeyword,
    totalCount,
    groupCount,
    isFiltered,
  }
}
