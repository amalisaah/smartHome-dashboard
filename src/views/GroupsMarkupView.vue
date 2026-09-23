<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { SBanner, SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import AddGroupDialog from '@/components/groups/AddGroupDialog.vue'
import GroupsCommitBar from '@/components/groups/GroupsCommitBar.vue'
import GroupsMarkupRow from '@/components/groups/GroupsMarkupRow.vue'
import {
  useApplyGroupChanges,
  useCreateGroup,
  useMarkupGroups,
} from '@/api/hooks/groups'
import type { GroupChange } from '@/api/groups'
import { useGroupsMarkup } from '@/composables/useGroupsMarkup'
import { useOnline } from '@/composables/useOnline'

const groupsQuery = useMarkupGroups()
const createMutation = useCreateGroup()
const applyMutation = useApplyGroupChanges()

const {
  rows,
  commit,
  blocked,
  pendingEdits,
  newGroup,
  nameTaken,
  setDraft,
  setName,
  normalise,
  normaliseName,
  revert,
  discardAll,
} = useGroupsMarkup(() => groupsQuery.data.value ?? [])

const online = useOnline()

const table = ref<HTMLElement | null>(null)

const adding = ref(false)
const addButton = ref<InstanceType<typeof SButton> | null>(null)

/** Either write is in flight — the bar says so rather than taking a second press. */
const saving = computed(() => applyMutation.isPending.value || createMutation.isPending.value)

/** Closing a dialog puts the keyboard back where it was opened from. */
function closeAdd() {
  adding.value = false
  nextTick(() => (addButton.value?.$el as HTMLElement | undefined)?.focus())
}

/**
 * A new group is saved on the press — there is nothing to preview, because an
 * empty group reprices nothing. The row appears when the refetch brings it
 * back, with the id and slug the server minted.
 */
function onCreate(name: string, markup: string) {
  const body = newGroup(name, markup)
  if (!body) return
  createMutation.mutate(body)
  closeAdd()
}

/** The press. Nothing settles locally: the rows re-read from the answer. */
function apply() {
  if (!commit.value || blocked.value || !online.value || saving.value) return

  const changes: GroupChange[] = pendingEdits.value.map(({ id, name, markupBps }) => ({
    id,
    ...(name === undefined ? {} : { name }),
    ...(markupBps === undefined ? {} : { default_markup_bps: markupBps }),
  }))

  applyMutation.mutate(changes)
}

const COLUMNS = ['Group', 'Items', 'Markup', 'Avg margin', 'Capital in stock']

/**
 * He is replacing the number, not appending to it. A name is not the same: he
 * is as likely to be fixing one letter of it, so the caret lands where he put
 * it and the name is left alone.
 */
function onFocusin(event: FocusEvent) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  if (input.closest('[data-column="markup"]')) input.select()
}

/**
 * Enter walks down the column it is pressed in — the names or the markups, and
 * never across from one to the other. At the foot of a column there is nowhere
 * to go, so the caret stays where it is rather than wrapping back to the top.
 */
function moveDown(current: HTMLInputElement) {
  const column = current.closest('[data-column]')?.getAttribute('data-column')
  if (!column) return

  const inputs = Array.from(
    table.value?.querySelectorAll<HTMLInputElement>(`[data-column="${column}"] input`) ?? [],
  )
  const next = inputs[inputs.indexOf(current) + 1] ?? current
  next.focus()
  next.select()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    if (commit.value && online.value && !blocked.value) apply()
    return
  }

  const input = event.target
  if (!(input instanceof HTMLInputElement)) return

  if (event.key === 'Enter') {
    event.preventDefault()
    moveDown(input)
    return
  }

  // The first Escape takes back what the row under the caret is holding —
  // its name and its markup both. Once that row is clean, a second one takes
  // back the rest.
  if (event.key === 'Escape') {
    event.preventDefault()
    const slug = input.closest('[data-slug]')?.getAttribute('data-slug')
    const row = rows.value.find((candidate) => candidate.group.slug === slug)
    if (slug && (row?.projection || row?.rename || row?.nameError)) revert(slug)
    else discardAll()
  }
}
</script>

<template>
  <!-- D1 — drawn at 1100, on the app's 1440 frame -->
  <AppLayout>
    <div class="header">
      <SText type="frame-title" as="h1">Groups &amp; markup</SText>

      <div class="header-right">
        <!-- The count is live now that the table can grow. Groups are the
             coarse cut; keywords still carry everything finer than one. -->
        <SText type="row-meta" color="fg-2-soft">
          <!-- TODO: update when ai is ready -->
          {{ rows.length }} groups. Keywords carry everything else.
        </SText>
        <SButton ref="addButton" variant="primary" size="sm" @click="adding = true">
          Add group
        </SButton>
      </div>
    </div>

    <SBanner
      v-if="groupsQuery.isError.value"
      variant="error"
      label="error"
      title="Couldn't load groups."
    >
      {{ (groupsQuery.error.value as Error)?.message }}
    </SBanner>

    <!-- A write that failed leaves what he typed where it is; the table has
         refetched, so the rows still holding a draft are the ones to try again. -->
    <SBanner
      v-if="applyMutation.isError.value"
      variant="error"
      label="error"
      title="Couldn't save every change."
    >
      {{ (applyMutation.error.value as Error)?.message }}
    </SBanner>

    <SBanner
      v-if="createMutation.isError.value"
      variant="error"
      label="error"
      title="Couldn't create the group."
    >
      {{ (createMutation.error.value as Error)?.message }}
    </SBanner>

    <div
      ref="table"
      role="table"
      aria-label="Groups and markup"
      @focusin="onFocusin"
      @keydown="onKeydown"
    >
      <div class="head" role="row">
        <SText
          v-for="(column, index) in COLUMNS"
          :key="column"
          type="column-header"
          color="micro"
          role="columnheader"
          :class="{ num: index > 0 }"
        >
          {{ column }}
        </SText>
      </div>

      <GroupsMarkupRow
        v-for="row in rows"
        :key="row.group.slug"
        :row="row"
        @update:draft="setDraft(row.group.slug, $event)"
        @update:name="setName(row.group.slug, $event)"
        @normalise="normalise(row.group.slug)"
        @normalise-name="normaliseName(row.group.slug)"
      />

      <div v-if="!rows.length" class="empty">
        <SText type="cell" color="fg-2-soft">
          {{ groupsQuery.isPending.value ? 'Loading groups…' : 'No groups yet.' }}
        </SText>
      </div>
    </div>

    <!-- The card has no footer at rest: the bar exists only while something is
         dirty, and the numbers in it update in place as he types. -->
    <Transition name="commit">
      <GroupsCommitBar
        v-if="commit"
        :summary="commit"
        :offline="!online"
        :blocked="blocked"
        :saving="saving"
        @discard="discardAll"
        @apply="apply"
      />
    </Transition>

    <AddGroupDialog v-if="adding" :taken="nameTaken" @create="onCreate" @dismiss="closeAdd" />
  </AppLayout>
</template>

<style scoped>
.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-line);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: none;
}

.head {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 1fr 1fr 1.4fr;
  gap: 14px;
  padding: 10px 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.num {
  text-align: right;
}

.empty {
  padding: 20px;
}

/* It arrives; it does not leave slowly. Once it is there the figures inside it
   change without it moving at all. */
.commit-enter-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.commit-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

@media (prefers-reduced-motion: reduce) {
  .commit-enter-active {
    transition: none;
  }
}
</style>
