import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  applyGroupChanges,
  createGroup,
  fetchMarkupGroups,
  updateGroup,
  type GroupChange,
} from '@/api/groups'
import { catalogueKeys } from '@/api/hooks/catalogue'
import type { ApiGroupCreate, ApiGroupUpdate } from '@/types/groupsApi'

export const groupKeys = {
  all: ['groups'] as const,
  table: (archived = false) => [...groupKeys.all, 'table', { archived }] as const,
}

/** `GET /groups/details` — the rows with their markups and derived figures. */
export function useMarkupGroups(archived = false) {
  return useQuery({
    queryKey: groupKeys.table(archived),
    queryFn: ({ signal }) => fetchMarkupGroups({ archived }, signal),
  })
}

/**
 * The catalogue is in here because a markup moves the derived selling price of
 * every non-overridden item, and a rename moves the group's label on every
 * item row — neither visible from this screen.
 */
function useGroupWriteInvalidation() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({ queryKey: groupKeys.all })
    await queryClient.invalidateQueries({ queryKey: catalogueKeys.all })
  }
}

/** `POST /groups`. A duplicate name is a 409. */
export function useCreateGroup() {
  const invalidate = useGroupWriteInvalidation()

  return useMutation({
    mutationFn: (body: ApiGroupCreate) => createGroup(body),
    onSuccess: invalidate,
  })
}

/** `PATCH /groups/{id}` — one group's name, markup, or both. */
export function useUpdateGroup() {
  const invalidate = useGroupWriteInvalidation()

  return useMutation({
    mutationFn: ({ id, ...body }: GroupChange) => updateGroup(id, body as ApiGroupUpdate),
    onSuccess: invalidate,
  })
}

/**
 * The press: every dirty row, in one call. Invalidates on settle, not success
 * — it is a sequence of `PATCH`es, so a failure part-way leaves some of them
 * saved and the client no longer knows which.
 */
export function useApplyGroupChanges() {
  const invalidate = useGroupWriteInvalidation()

  return useMutation({
    mutationFn: (changes: GroupChange[]) => applyGroupChanges(changes),
    onSettled: invalidate,
  })
}
