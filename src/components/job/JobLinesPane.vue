<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { SButton, SSegmented, SText } from '@/components/atoms'
import JobLineRow from './JobLineRow.vue'
import type { JobLinesView, JobRoomGroup } from '@/types/job'

const props = defineProps<{
  groups: JobRoomGroup[]
  view: JobLinesView
  differingCount: number
  lineCount: number
  asQuotedCount: number
  fittedValue: (lineId: number, fitted: number) => string
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:view': [value: JobLinesView]
  'update:fitted': [lineId: number, value: string]
  commit: [lineId: number]
  /** The + Add line picker, which reuses A's item picker and is not drawn. */
  addLine: []
}>()

/**
 * Differences and All are two views of the same lines, so this is a track with
 * a tile riding in it rather than a filled choice — the fill is for a value
 * stored on the record, and which rows are on screen is not one.
 *
 * The counts ride in the segments' own `count` slot: every figure in this
 * system is mono, and a tab reading `Differences` while its figure sat
 * somewhere else would make him look twice.
 */
const options = computed(() => [
  { label: 'Differences', value: 'differences' as const, count: props.differingCount },
  { label: 'All', value: 'all' as const, count: props.lineCount },
])

// --- the caret ---------------------------------------------------------------

const rows = ref<InstanceType<typeof JobLineRow>[]>([])

/** Every row on screen, in the order the table draws them. */
const flat = computed(() => props.groups.flatMap((group) => group.rows))

/**
 * Enter moves to the next row's Fitted, which is how a column of counts is
 * actually typed — down, not across. The last row keeps the caret rather than
 * wrapping to the first: wrapping would silently put him back at the top of a
 * table he thought he had finished.
 */
async function focusNext(lineId: number) {
  const index = flat.value.findIndex((row) => row.id === lineId)
  if (index === -1 || index === flat.value.length - 1) return
  await nextTick()
  rows.value[index + 1]?.focus()
}
</script>

<template>
  <section class="lines">
    <div class="toolbar">
      <span class="toolbar-title">
        <SText type="heading" as="h2">Lines</SText>
        <SText type="ui" color="fg-2">{{ differingCount }} differ from the quote</SText>
      </span>

      <div class="toolbar-actions">
        <SSegmented
          :model-value="view"
          :options="options"
          variant="track"
          size="lg"
          @update:model-value="emit('update:view', $event)"
        />
        <SButton v-if="!readOnly" variant="chrome" size="toolbar" @click="emit('addLine')">
          + Add line
        </SButton>
      </div>
    </div>

    <div class="table">
      <div class="head" role="row">
        <SText type="column-header">Item</SText>
        <SText type="column-header">Need</SText>
        <SText type="column-header" class="num">Quoted</SText>
        <SText type="column-header" class="num">Fitted</SText>
        <SText type="column-header">Change</SText>
        <SText type="column-header" class="num">Charged</SText>
        <!-- Amber on the head, not in the cells: it marks the column as his
             rather than hers, which is a fact about the column. -->
        <SText type="column-header" color="risk" class="num">Cost · owner</SText>
        <SText type="column-header">Note</SText>
      </div>

      <template v-for="group in groups" :key="group.room">
        <div class="group">
          <SText type="micro" color="fg-2">{{ group.room }}</SText>
        </div>
        <JobLineRow
          v-for="row in group.rows"
          :key="row.id"
          ref="rows"
          :row="row"
          :fitted="fittedValue(row.id, row.fitted)"
          :read-only="readOnly"
          @update:fitted="emit('update:fitted', row.id, $event)"
          @commit="emit('commit', row.id)"
          @next="focusNext(row.id)"
        />
      </template>

      <!-- Everything that went in as quoted, in one row. His three minutes go
           on the lines that changed, not on scanning all eleven. -->
      <button
        v-if="view === 'differences' && asQuotedCount > 0"
        type="button"
        class="collapsed"
        @click="emit('update:view', 'all')"
      >
        <SText type="meta" color="fg-2">
          {{ asQuotedCount }} lines fitted as quoted · show all
        </SText>
      </button>

      <!-- Nothing differs and nothing is hidden: the table would otherwise be a
           header over a bare strip of background. -->
      <p v-else-if="groups.length === 0" class="empty">
        <SText type="meta" color="fg-2">Every line went in as quoted.</SText>
      </p>
    </div>
  </section>
</template>

<style scoped>
.lines {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  overflow: hidden;
}

/*
 * Eight columns do not become four on a narrower screen — they become eight
 * columns he scrolls. The table was drawn at 1440 and every column in it is one
 * he reads by column; reflowing it into stacked cards would be a layout nobody
 * designed, and would lose the alignment that makes a column of counts
 * scannable in the first place.
 */
@media (max-width: 1100px) {
  .table {
    overflow-x: auto;
  }

  .table > * {
    min-width: 860px;
  }
}

.head {
  display: grid;
  grid-template-columns:
    minmax(0, 2.6fr) 0.9fr 0.6fr 0.8fr 0.9fr 0.9fr 0.9fr minmax(0, 1.8fr);
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.head > * {
  min-width: 0;
}

.num {
  text-align: right;
}

/* The room a run of lines went in. Quieter than the column heads above it:
   it divides the table rather than naming what is in it. */
.group {
  padding: 8px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-divider);
}

.group :deep(.s-text) {
  letter-spacing: 0.08em;
}

.collapsed {
  display: block;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  background: var(--color-surface);
  border: none;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.collapsed:hover {
  background: var(--color-row-hover);
}

.collapsed:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.empty {
  margin: 0;
  padding: 16px;
  text-align: center;
}
</style>
