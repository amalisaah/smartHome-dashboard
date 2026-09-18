import type { ApiGroup, ApiItem, ApiSummary } from '@/types/api'
import type { CatalogueGroupRef, CatalogueItem, CatalogueSummary } from '@/types/catalogue'

/**
 * Wire → view model. Everything snake_case stops here, and money stays in integer
 * pesewas all the way through, so nothing rounds a float on the way to a screen.
 *
 * Pure functions over the shapes in `@/types/api`, no fetching: `@/api/catalogue`
 * calls them on what comes back. A backend rename lands in this one file rather
 * than in every component.
 */

export function toCatalogueItem(api: ApiItem): CatalogueItem {
  return {
    id: api.id,
    name: api.name,
    group: api.group,
    keywords: api.keywords,
    stock: api.stock_on_hand,
    reorderLevel: api.reorder_level,
    leadDays: api.lead_time_days,
    landedCostPesewas: api.landed_unit_cost_pesewas,
    // `selling_price_pesewas` is non-nullable on the wire, so this never actually
    // arrives null today. The view model keeps the null so the `no markup` cell
    // state is already wired for when the backend can express it.
    sellPricePesewas: api.selling_price_pesewas,
    hasSupplierLink: api.supplier_url !== null,
    priceOverridden: api.selling_price_override_pesewas !== null,
    needsAttention: api.needs_attention,
    discontinuedAt: api.discontinued_at,
    discontinueReason: api.discontinue_reason,
    readyToArchive: api.ready_to_archive,
  }
}

/**
 * The filter needs only a group's identity; the shipment preview also needs the
 * multiplier, because picking a group there is what gives a new item a price.
 */
export function toGroupRef(api: ApiGroup): CatalogueGroupRef {
  return { id: api.id, name: api.name, slug: api.slug, defaultMarkupBps: api.default_markup_bps }
}

export function toCatalogueSummary(api: ApiSummary): CatalogueSummary {
  return {
    capitalInStockPesewas: api.capital_in_stock_pesewas,
    retailValuePesewas: api.retail_value_pesewas,
    unitsInStock: api.units_in_stock,
    restockCount: api.items_needing_restock,
    longestRestockLead: api.longest_restock_lead_days,
    attentionCount: api.items_needing_attention,
    readyToArchiveCount: api.items_ready_to_archive,
    draftShipmentCount: api.draft_shipment_count,
    nextDraftEta: api.next_draft_eta,
  }
}
