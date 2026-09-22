/**
 * Wire → view model for the groups module. The screen never sees a snake_case
 * key or a `_pesewas` suffix; a backend rename lands here rather than in eight
 * components.
 *
 * Money stays in integer pesewas across the seam — it is divided down in
 * `@/utils/format`, at the last possible moment.
 */

import type { ApiGroupDetails } from '@/types/groupsApi'
import type { MarkupGroup } from '@/types/groups'

/**
 * Basis points → the whole percent the Avg margin cell renders. Truncated, not
 * rounded: 3750 bps is 37.5%, and the reference frame draws 37.
 *
 * Null survives as null — an empty group, or one where nothing has been
 * received, has no margin to state, and 0% would read as selling at cost. A
 * group created on this screen starts exactly there, so this is not an edge
 * case: it is the first thing a new row shows.
 */
export const marginBpsToPercent = (bps: number | null) =>
  bps === null ? null : Math.floor(bps / 100)

/**
 * One row of the table, from the one endpoint that holds all of it.
 *
 * `avgMarginPercent` falls back to 0 where the group has no priced stock,
 * because `MarkupGroup` types it as a number. It should be `number | null`
 * with the cell rendering an em dash — 0% reads as selling at cost, which is a
 * different claim, and it is what every newly created group would show.
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
