/** The eight fixed groups. Never free-typed, never a second hierarchy level. */
export const CATALOGUE_GROUPS = [
  'lighting',
  'switching',
  'security',
  'climate',
  'power',
  'networking',
  'sensors',
  'control',
] as const

export type CatalogueGroup = (typeof CATALOGUE_GROUPS)[number]

/**
 * What one row renders. Not a data model — the handoff is UI-only, so this is
 * just the fields the list and the summary strip display.
 */
export interface CatalogueItem {
  id: string
  /** Absent → the row renders `Untitled item`. */
  name: string | null
  /** Absent → the Group cell renders `—` in risk. */
  group: CatalogueGroup | null
  /** Searched together with the name. */
  keywords: string[]
  stock: number
  /** 0 means "no reorder level set" — such a row is never low stock. */
  reorderLevel: number
  leadDays: number | null
  landedCost: number
  /** Absent → the Sell cell renders `no markup` in risk. */
  sellPrice: number | null
  hasSupplierLink: boolean
  priceOverridden: boolean
}

export interface DraftShipmentSummary {
  count: number
  /** Already formatted for display, e.g. "24 Sep". */
  nextArrival: string
}

export type SortColumn = 'name' | 'group' | 'stock' | 'landed' | 'sell' | 'margin' | 'lead'
export type SortDirection = 'asc' | 'desc'

export type GroupFilter = CatalogueGroup | 'all'

/** Low stock is the only state that tints a row. */
export function isLowStock(item: CatalogueItem): boolean {
  return item.reorderLevel > 0 && item.stock <= item.reorderLevel
}

/** Something is missing that stops the item being quoted or reordered. */
export function needsAttention(item: CatalogueItem): boolean {
  return !item.name || !item.group || !item.hasSupplierLink || item.sellPrice === null
}

/** Integer percent of the selling price. */
export function marginPercent(item: CatalogueItem): number | null {
  if (item.sellPrice === null || item.sellPrice === 0) return null
  return Math.round(((item.sellPrice - item.landedCost) / item.sellPrice) * 100)
}
