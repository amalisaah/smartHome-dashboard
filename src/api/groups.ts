/**
 * The seam between the wire and the groups & markup screen. Everything here
 * calls an endpoint that exists in `openapi.json` today, and maps its answer
 * through `@/utils/mapper/groupsMapper`.
 *
 * Reads are wrapped by hooks in `@/api/hooks/groups`. Writes are plain
 * functions, called from a `useMutation` at the view — the shape the shipment
 * screens use, so invalidation is declared where the consequence is visible.
 *
 * The screen runs on `@/data/groupsMock` until this is wired. Two things it
 * mocks have no endpoint behind them yet — the projection while he types and
 * the overridden count — and both are spelled out in `@/types/groupsApi`.
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
 * `GET /groups/details` — the markup table, in `sort_order`. One request: the
 * markup the screen edits and the aggregates beside it come back together.
 *
 * A group with no items answers with zeroes rather than dropping out, so a
 * group created here is a row from the moment it exists.
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

/**
 * `POST /groups` → 201. The slug is derived server-side from the name.
 *
 * A duplicate name comes back **409**, which is the collision the row's
 * "already a group" flag is about — the client checks it first so he is told
 * before he presses, but the server is the one that decides.
 *
 * The answer carries no aggregates, and a new group has none worth having:
 * refetch the table rather than splicing this row in.
 */
export const createGroup = (body: ApiGroupCreate) => apiSend<ApiGroup>('POST', '/groups', body)

/** `PATCH /groups/{id}` → 200. Partial; the slug is not re-derived on rename. */
export const updateGroup = (id: number, body: ApiGroupUpdate) =>
  apiSend<ApiGroup>('PATCH', `/groups/${id}`, body)

/** One row's press: a rename, a markup, or both. */
export interface GroupChange extends ApiGroupUpdate {
  id: number
}

/**
 * The press, as the API can currently take it: **one `PATCH` per group, in
 * sequence.** The screen commits the whole table at once and states a single
 * consequence before it does, so this is the one place the client is weaker
 * than the design — a failure part-way through leaves some rows written and
 * the sentence he just read no longer true.
 *
 * Two mitigations, neither of them a fix:
 *
 *   - Renames go first. A 409 on a name is the likely failure and the only one
 *     the user can cause, so it lands before any markup has been written.
 *   - Sequential, not parallel: the first failure stops the rest, so the
 *     damage is a prefix rather than a scatter.
 *
 * The fix is a batch endpoint — `POST /groups/apply` taking the whole change
 * set and committing it in one transaction. Until then the caller must refetch
 * the table on both success and failure, because on failure it no longer knows
 * what is saved.
 */
export async function applyGroupChanges(changes: GroupChange[]): Promise<void> {
  const ordered = [...changes].sort(
    (a, b) => Number(b.name !== undefined) - Number(a.name !== undefined),
  )

  for (const { id, ...body } of ordered) {
    await updateGroup(id, body)
  }
}
