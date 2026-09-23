import type { ApiGroupDetails } from '@/types/groupsApi'
import type { MarkupGroup } from '@/types/groups'

/**
 * Basis points → the whole percent the cell renders. Truncated, not rounded:
 * 3750 bps is 37.5% and the reference frame draws 37.
 */
export const marginBpsToPercent = (bps: number | null) =>
  bps === null ? null : Math.floor(bps / 100)

export const toMarkupGroup = (api: ApiGroupDetails): MarkupGroup => ({
  id: api.id,
  name: api.name,
  slug: api.slug,
  markupBps: api.default_markup_bps,
  itemCount: api.item_count,
  avgMarginPercent: marginBpsToPercent(api.margin_bps),
  capitalInStockPesewas: api.capital_in_stock_pesewas,
  overriddenCount: api.overridden_item_count,
})
