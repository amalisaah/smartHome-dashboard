import { useQuery } from '@tanstack/vue-query'
import { fetchMarkupGroups } from '@/api/groups'

/**
 * Read hooks for the groups module. Thin on purpose — a key and a queryFn,
 * nothing else. Freshness, retry and refetch policy live once, in
 * `@/api/queryClient`.
 *
 * Writes are not here: `createGroup`, `updateGroup` and `applyGroupChanges` in
 * `@/api/groups` are called from a `useMutation` at the view, which is where
 * the invalidation they cause should be readable. After any of them,
 * invalidate `groupKeys.all` — and `catalogueKeys.all` too, since a markup
 * change moves every derived selling price the catalogue is showing, and a
 * rename moves the group label on every item row.
 *
 * There is no preview hook. The projection the screen shows while he types has
 * no endpoint behind it; see the PROPOSED block in `@/types/groupsApi` for the
 * three fields that would let it be computed locally instead.
 */
export const groupKeys = {
  all: ['groups'] as const,
  /** The markup table — `GET /groups/details`. */
  table: (archived = false) => [...groupKeys.all, 'table', { archived }] as const,
}

/** The rows with their markups and derived figures. */
export function useMarkupGroups(archived = false) {
  return useQuery({
    queryKey: groupKeys.table(archived),
    queryFn: ({ signal }) => fetchMarkupGroups({ archived }, signal),
  })
}
