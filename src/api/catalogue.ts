import type { ApiGroup, ApiItem, ApiSummary } from '@/types/api'
import type { CatalogueGroupRef, CatalogueItem, CatalogueSummary } from '@/types/catalogue'
import { toCatalogueItem, toCatalogueSummary, toGroupRef } from '@/utils/mapper/catalogueMapper'
import { apiGet } from './http'

/**
 * The seam between the wire and the screen. The fetchers below call the real
 * endpoints and map the answers through `@/utils/mapper/catalogueMapper`, so no
 * component ever sees a `_pesewas` key or a snake_case field.
 *
 * Search, filter and sort are deliberately not query params yet. `GET /items` is
 * unpaginated, so the list is fetched once and worked over in memory — that is
 * what lets a keystroke re-filter without a round trip and lets a row explain
 * which keyword matched. The params exist on the endpoint for the day the list
 * paginates; `@/composables/useCatalogueList` is where that switch would land.
 */

/** The sorts `GET /items` does server-side. Ascending only. */
export type CatalogueItemSort = 'name' | 'stock' | 'margin'

export interface CatalogueItemsQuery {
  /** `?q=` — substring across name and keywords. */
  search?: string
  groupId?: number
  needsAttention?: boolean
  lowStock?: boolean
  discontinued?: boolean
  readyToArchive?: boolean
  sort?: CatalogueItemSort
  archived?: boolean
}

export interface CatalogueGroupsQuery {
  archived?: boolean
}

/** `GET /items`. No argument: active items in id order. Unset keys are not sent. */
export async function fetchItems(
  query: CatalogueItemsQuery = {},
  signal?: AbortSignal,
): Promise<CatalogueItem[]> {
  const rows = await apiGet<ApiItem[]>(
    '/items',
    {
      q: query.search,
      group_id: query.groupId,
      needs_attention: query.needsAttention,
      low_stock: query.lowStock,
      discontinued: query.discontinued,
      ready_to_archive: query.readyToArchive,
      sort: query.sort,
      archived: query.archived,
    },
    signal,
  )
  return rows.map(toCatalogueItem)
}

/** `GET /groups` — every active group, already in `sort_order`. */
export async function fetchGroups(
  query: CatalogueGroupsQuery = {},
  signal?: AbortSignal,
): Promise<CatalogueGroupRef[]> {
  const rows = await apiGet<ApiGroup[]>('/groups', { archived: query.archived }, signal)
  return rows.map(toGroupRef)
}

/** `GET /summary`. */
export async function fetchSummary(signal?: AbortSignal): Promise<CatalogueSummary> {
  const api = await apiGet<ApiSummary>('/summary', undefined, signal)
  return toCatalogueSummary(api)
}
