/**
 * The view model the screen renders. Mapped from the wire types in `@/types/api`
 * by `@/api/catalogue` — camelCase, but money stays in integer pesewas all the
 * way to the formatter, so nothing ever rounds a float on the way through.
 */

/** A group, as embedded on an item and as offered in the filter. */
export interface CatalogueGroupRef {
  id: number
  name: string
  slug: string
  /**
   * Basis points — 6000 = a markup of 1.60. Absent on the ref embedded in an
   * item row, which the wire contract does not carry a markup on; present when
   * the group came from `GET /groups`, where a selling price gets its multiplier.
   */
  defaultMarkupBps?: number
}

export interface CatalogueItem {
  id: number
  /** Absent → the row renders `Untitled item`. */
  name: string | null
  /** Absent → the Group cell renders `—` in risk. */
  group: CatalogueGroupRef | null
  /** Searched together with the name. */
  keywords: string[]
  stock: number
  reorderLevel: number
  leadDays: number | null
  /** Integer pesewas. */
  landedCostPesewas: number
  /**
   * Integer pesewas. Never null from the API as it stands — `selling_price_pesewas`
   * is non-nullable, so the `no markup` cell state below is unreachable until the
   * backend can say "this item has no basis for a price".
   */
  sellPricePesewas: number | null
  hasSupplierLink: boolean
  priceOverridden: boolean
  /** The backend's flag, not a local rule: see `needs_attention` in openapi.json. */
  needsAttention: boolean
  /** Set → we are selling this down and will not reorder it. */
  discontinuedAt: string | null
  discontinueReason: string | null
  /** Discontinued and sold through, so it can be archived. */
  readyToArchive: boolean
}

/** The nine numbers from `GET /summary`. */
export interface CatalogueSummary {
  capitalInStockPesewas: number
  retailValuePesewas: number
  unitsInStock: number
  restockCount: number
  longestRestockLead: number | null
  attentionCount: number
  readyToArchiveCount: number
  draftShipmentCount: number
  /** ISO date-time, or null when no draft has anything to estimate from. */
  nextDraftEta: string | null
}

export type SortColumn = 'name' | 'group' | 'stock' | 'landed' | 'sell' | 'margin' | 'lead'
export type SortDirection = 'asc' | 'desc'

/** A group slug, or `all`. Slugs rather than ids because a `<select>` yields strings. */
export type GroupFilter = string
export const ALL_GROUPS = 'all'

/**
 * Low stock is the only state that tints a row. A discontinued item is never low:
 * running it down to zero is the plan, not a shortfall. This is the same predicate
 * `GET /stock/low` and the summary's `items_needing_restock` read, so the chip
 * count can never disagree with the rows it filters to.
 */
export function isLowStock(item: CatalogueItem): boolean {
  return item.discontinuedAt === null && item.stock <= item.reorderLevel
}

/** Integer percent of the selling price. */
export function marginPercent(item: CatalogueItem): number | null {
  if (item.sellPricePesewas === null || item.sellPricePesewas === 0) return null
  return Math.round(
    ((item.sellPricePesewas - item.landedCostPesewas) / item.sellPricePesewas) * 100,
  )
}
