<script setup lang="ts">
import { ref } from 'vue'
import { SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import GroupsCommitBar from '@/components/groups/GroupsCommitBar.vue'
import GroupsMarkupRow from '@/components/groups/GroupsMarkupRow.vue'
import { useGroupsMarkup } from '@/composables/useGroupsMarkup'
import { useOnline } from '@/composables/useOnline'

const { rows, commit, setDraft, normalise, revert, discardAll, apply } = useGroupsMarkup()
const online = useOnline()

const table = ref<HTMLElement | null>(null)

const COLUMNS = ['Group', 'Items', 'Markup', 'Avg margin', 'Capital in stock']

/** He is replacing the number, not appending to it. */
function onFocusin(event: FocusEvent) {
  if (event.target instanceof HTMLInputElement) event.target.select()
}

/**
 * Enter walks down the markup column. At the foot of it there is nowhere to go,
 * so the caret stays where it is rather than wrapping back to the top.
 */
function moveDown(current: HTMLInputElement) {
  const inputs = Array.from(table.value?.querySelectorAll('input') ?? [])
  const next = inputs[inputs.indexOf(current) + 1] ?? current
  next.focus()
  next.select()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    if (commit.value && online.value) apply()
    return
  }

  const input = event.target
  if (!(input instanceof HTMLInputElement)) return

  if (event.key === 'Enter') {
    event.preventDefault()
    moveDown(input)
    return
  }

  // The first Escape takes back the number under the caret. Once that row is
  // clean, a second one takes back the rest.
  if (event.key === 'Escape') {
    event.preventDefault()
    const slug = input.closest('[data-slug]')?.getAttribute('data-slug')
    const row = rows.value.find((candidate) => candidate.group.slug === slug)
    if (slug && row?.projection) revert(slug)
    else discardAll()
  }
}
</script>

<template>
  <!-- D1 — drawn at 1100, on the app's 1440 frame -->
  <AppLayout>
    <div class="header">
      <SText type="frame-title" as="h1">Groups &amp; markup</SText>
      <!-- This pre-empts "where is the add-group button" without a disabled
           control or a tooltip, so nothing on screen has to be greyed out. -->
      <SText type="row-meta" color="fg-2-soft">
        <!-- TODO: update when ai is ready -->
        Eight groups, fixed. Keywords carry everything else.
      </SText>
    </div>

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
        @normalise="normalise(row.group.slug)"
      />
    </div>

    <!-- The card has no footer at rest: the bar exists only while something is
         dirty, and the numbers in it update in place as he types. -->
    <Transition name="commit">
      <GroupsCommitBar
        v-if="commit"
        :summary="commit"
        :offline="!online"
        @discard="discardAll"
        @apply="apply"
      />
    </Transition>
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
