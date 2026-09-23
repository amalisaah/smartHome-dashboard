/**
 * The seam between the wire and the groups & markup screen. Answers are mapped
 * through `@/utils/mapper/groupsMapper`, so no component sees a snake_case key.
 */

import type { ApiGroup } from '@/types/api'
import type { MarkupGroup } from '@/types/groups'
import type {
  ApiGroupCreate,
  ApiGroupDetails,
  ApiGroupDetailsQuery,
  ApiGroupUpdate,
} from '@/types/groupsApi'
import { toMarkupGroup } from '@/utils/mapper/groupsMapper'
import { apiGet, apiSend } from './http'

/**
 * `GET /groups/details` — the table, in `sort_order`. A group with no items
 * answers with zeroes rather than dropping out, so one created here is a row
 * from the moment it exists.
 */
export async function fetchMarkupGroups(
  query: ApiGroupDetailsQuery = {},
  signal?: AbortSignal,
): Promise<MarkupGroup[]> {
  const rows = await apiGet<ApiGroupDetails[]>(
    '/groups/details',
    { archived: query.archived },
    signal,
  )
  return rows.map(toMarkupGroup)
}

/** `POST /groups`. The answer carries no aggregates — refetch, don't splice. */
export const createGroup = (body: ApiGroupCreate) => apiSend<ApiGroup>('POST', '/groups', body)

export const updateGroup = (id: number, body: ApiGroupUpdate) =>
  apiSend<ApiGroup>('PATCH', `/groups/${id}`, body)

/** One row's press: a rename, a markup, or both. */
export interface GroupChange extends ApiGroupUpdate {
  id: number
}

/**
 * The press, as the API can take it: one `PATCH` per group, in sequence. The
 * screen commits the whole table at once and states a single consequence
 * first, so this is where the client is weaker than the design — a failure
 * part-way leaves some rows written and that sentence no longer true.
 *
 * Renames go first: a 409 on a name is the likely failure and the only one he
 * can cause, so it lands before any markup has been. Sequential, so the damage
 * is a prefix rather than a scatter. The fix is a batch endpoint.
 */
export async function applyGroupChanges(changes: GroupChange[]): Promise<void> {
  const ordered = [...changes].sort(
    (a, b) => Number(b.name !== undefined) - Number(a.name !== undefined),
  )

  for (const { id, ...body } of ordered) {
    await updateGroup(id, body)
  }
}
