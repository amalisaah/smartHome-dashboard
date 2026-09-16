import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CATALOGUE_ITEMS, MOCK_LOAD_MS } from '@/data/catalogueMock'
import {
  CATALOGUE_GROUPS,
  isLowStock,
  marginPercent,
  needsAttention,
  type CatalogueItem,
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
    const stored = sessionStorage.getItem(GROUP_FILTER_KEY)
    if (stored && (stored === 'all' || (CATALOGUE_GROUPS as readonly string[]).includes(stored))) {
      return stored as GroupFilter
    }
  } catch {
    // Session storage can be unavailable; the default is fine.
  }
  return 'all'
}

export function useCatalogueList() {
  const items = ref<CatalogueItem[]>([])
  const loading = ref(true)

  const query = ref('')
  const debouncedQuery = ref('')
  const groupFilter = ref<GroupFilter>(readStoredGroup())
  const lowStockOnly = ref(false)
  const attentionOnly = ref(false)
  const sortColumn = ref<SortColumn>('name')
  const sortDirection = ref<SortDirection>('asc')
  const online = ref(true)

  // --- async content -------------------------------------------------------
  let loadTimer: ReturnType<typeof setTimeout> | undefined
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  onMounted(() => {
    online.value = navigator.onLine
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    loadTimer = setTimeout(() => {
      items.value = CATALOGUE_ITEMS
      loading.value = false
    }, MOCK_LOAD_MS)
  })

  onBeforeUnmount(() => {
    clearTimeout(loadTimer)
    clearTimeout(debounceTimer)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  const handleOnline = () => (online.value = true)
  const handleOffline = () => (online.value = false)

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
      if (groupFilter.value !== 'all' && item.group !== groupFilter.value) return false
      if (lowStockOnly.value && !isLowStock(item)) return false
      if (attentionOnly.value && !needsAttention(item)) return false
      return true
    })

    const direction = sortDirection.value
    return filtered.sort((a, b) => {
      switch (sortColumn.value) {
        case 'group':
          return compareText(a.group, b.group, direction) || compareText(displayName(a), displayName(b), 'asc')
        case 'stock':
          return compareNumeric(a.stock, b.stock, direction)
        case 'landed':
          return compareNumeric(a.landedCost, b.landedCost, direction)
        case 'sell':
          return compareNumeric(a.sellPrice, b.sellPrice, direction)
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

  // --- counts and summary --------------------------------------------------
  const totalCount = computed(() => items.value.length)
  const lowStockCount = computed(() => items.value.filter(isLowStock).length)
  const attentionCount = computed(() => items.value.filter(needsAttention).length)
  const groupCount = computed(
    () => new Set(items.value.map((item) => item.group).filter(Boolean)).size,
  )

  const summary = computed(() => {
    const restocking = items.value.filter(isLowStock)
    return {
      capitalInStock: items.value.reduce((total, item) => total + item.stock * item.landedCost, 0),
      unitsInStock: items.value.reduce((total, item) => total + item.stock, 0),
      retailValue: items.value.reduce(
        (total, item) => total + item.stock * (item.sellPrice ?? 0),
        0,
      ),
      restockCount: restocking.length,
      longestRestockLead: restocking.reduce(
        (longest, item) => Math.max(longest, item.leadDays ?? 0),
        0,
      ),
    }
  })

  const isFiltered = computed(
    () =>
      normalisedQuery.value !== '' ||
      groupFilter.value !== 'all' ||
      lowStockOnly.value ||
      attentionOnly.value,
  )

  return {
    items,
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
    summary,
    isFiltered,
  }
}
