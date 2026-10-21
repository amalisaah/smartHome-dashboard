<script setup lang="ts">
import { SText } from '@/components/atoms'
import QuoteListRow from './QuoteListRow.vue'
import QuoteListSkeleton from './QuoteListSkeleton.vue'
import type { QuoteListColumn } from '@/composables/useQuoteList'

/**
 * One of D2's three columns.
 *
 * **The count in the header is the unfiltered total.** Searching narrows the
 * cards and leaves the figure alone, so a search never reads as quotes having
 * gone missing — and the answer to "how many am I waiting on" stays on screen
 * while he looks for one of them.
 *
 * A column with no match keeps its place in the grid. The three states are a
 * fixed set, not a result list: a column that collapsed would move the other
 * two under his cursor mid-search.
 */
defineProps<{
  column: QuoteListColumn
  emptyText: string
  loading: boolean
}>()
</script>

<template>
  <section class="col">
    <header class="head">
      <span class="label">
        <SText type="screen-title" as="h2">{{ column.def.columnLabel }}</SText>
        <SText type="list-meta" color="fg-2">{{ column.total }}</SText>
      </span>
      <SText type="caption" color="fg-2">{{ column.def.hint }}</SText>
    </header>

    <QuoteListSkeleton v-if="loading" device="desk" :rows="3" />

    <template v-else>
      <QuoteListRow v-for="row in column.rows" :key="row.id" :row="row" device="desk" />

      <div v-if="!column.rows.length" class="empty">
        <SText type="row-meta">{{ emptyText }}</SText>
      </div>
    </template>
  </section>
</template>

<style scoped>
/* Each column grows with its content and the page scrolls. Columns do not
   scroll on their own: three independent scrollbars would mean three places to
   have missed something. */
.col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  min-width: 0;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 2px 6px;
}

.label {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.empty {
  padding: 14px 2px;
}
</style>
