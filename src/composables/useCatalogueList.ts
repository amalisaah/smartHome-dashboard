import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchCatalogue } from '@/api/catalogue'
import {
  ALL_GROUPS,
  isLowStock,
  marginPercent,
  type CatalogueGroupRef,
  type CatalogueItem,
  type CatalogueSummary,
  type GroupFilter,
  type SortColumn,
  type SortDirection,
} from '@/types/catalogue'

const SEARCH_DEBOUNCE_MS = 150
const GROUP_FILTER_KEY = 'catalogue.groupFilter'

export const SORT_COLUMN_LABELS: Record<SortColumn, string> = {
  name: 'name',
  group: 'group',
  stock: 'stock',
  landed: 'landed',
  sell: 'sell',
  margin: 'margin',
  lead: 'lead',
}

/** Until the first load lands there is nothing to count. */
const EMPTY_SUMMARY: CatalogueSummary = {
  capitalInStockPesewas: 0,
  retailValuePesewas: 0,
  unitsInStock: 0,
  restockCount: 0,
  longestRestockLead: null,
  attentionCount: 0,
  readyToArchiveCount: 0,
  draftShipmentCount: 0,
  nextDraftEta: null,
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

function readStoredGroup(): GroupFilter {
  try {
    return sessionStorage.getItem(GROUP_FILTER_KEY) ?? ALL_GROUPS
  } catch {
    // Session storage can be unavailable; the default is fine.
    return ALL_GROUPS
  }
}

export function useCatalogueList() {
  const items = ref<CatalogueItem[]>([])
  const groups = ref<CatalogueGroupRef[]>([])
  const summary = ref<CatalogueSummary>(EMPTY_SUMMARY)
  const loading = ref(true)

  const query = ref('')
  const debouncedQuery = ref('')
  const groupFilter = ref<GroupFilter>(readStoredGroup())
  const lowStockOnly = ref(false)
  const attentionOnly = ref(false)
  const sortColumn = ref<SortColumn>('name')
  const sortDirection = ref<SortDirection>('asc')
  const online = ref(true)

  // --- loading -------------------------------------------------------------
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  const handleOnline = () => (online.value = true)
  const handleOffline = () => (online.value = false)

  onMounted(async () => {
    online.value = navigator.onLine
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    try {
      const payload = await fetchCatalogue()
      items.value = payload.items
      groups.value = payload.groups
      summary.value = payload.summary

      // The stored slug came from a previous session; a group can have been
      // renamed away or archived since.
      if (
        groupFilter.value !== ALL_GROUPS &&
        !payload.groups.some((group) => group.slug === groupFilter.value)
      ) {
        groupFilter.value = ALL_GROUPS
      }
    } finally {
      loading.value = false
    }
  })

  onBeforeUnmount(() => {
    clearTimeout(debounceTimer)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  watch(query, (value) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => (debouncedQuery.value = value), SEARCH_DEBOUNCE_MS)
  })

  watch(groupFilter, (value) => {
    try {
      sessionStorage.setItem(GROUP_FILTER_KEY, value)
    } catch {
      // Persisting the group is a convenience, never a requirement.
    }
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
  // The chip counts are the server's, so `low stock · 4` can never label a filter
  // that then shows a different number of rows — both read the one predicate.
  const lowStockCount = computed(() => summary.value.restockCount)
  const attentionCount = computed(() => summary.value.attentionCount)

  // Still local: `GET /items` is unpaginated and `GET /groups` returns every
  // group, so these are whole-catalogue figures. They become page counts the day
  // the list paginates — `total_items` on the summary is the fix at that point.
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
    items,
    groups,
    summary,
    loading,
    online,
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
    lowStockCount,
    attentionCount,
    isFiltered,
  }
}
