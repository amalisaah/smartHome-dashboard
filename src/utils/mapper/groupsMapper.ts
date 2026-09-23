import type { ApiGroupDetails } from '@/types/groupsApi'
import type { MarkupGroup } from '@/types/groups'

/**
 * Basis points → the whole percent the cell renders. Truncated, not rounded:
 * 3750 bps is 37.5% and the reference frame draws 37.
 */
export const marginBpsToPercent = (bps: number | null) =>
  bps === null ? null : Math.floor(bps / 100)

/**
 * `avgMarginPercent` falls back to 0 where the group has no priced stock,
 * because `MarkupGroup` types it as a number. It wants `number | null` with
 * the cell rendering an em dash — 0% reads as selling at cost, and that is
 * what every newly created group would show.
 */
export const toMarkupGroup = (api: ApiGroupDetails): MarkupGroup => ({
  id: api.id,
  name: api.name,
  slug: api.slug,
  markupBps: api.default_markup_bps,
  itemCount: api.item_count,
  avgMarginPercent: marginBpsToPercent(api.margin_bps) ?? 0,
  capitalInStockPesewas: api.capital_in_stock_pesewas,
  overriddenCount: api.overridden_item_count,
})
