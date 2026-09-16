<script setup lang="ts">
import { SText } from '@/components/atoms'
import CatalogueTableRow from './CatalogueTableRow.vue'
import type { CatalogueItem, SortColumn, SortDirection } from '@/types/catalogue'

const props = defineProps<{
  items: CatalogueItem[]
  query: string
  loading: boolean
  sortColumn: SortColumn
  sortDirection: SortDirection
}>()

defineEmits<{ sort: [column: SortColumn]; open: [item: CatalogueItem] }>()

const COLUMNS: { key: SortColumn; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Item', numeric: false },
  { key: 'group', label: 'Group', numeric: false },
  { key: 'stock', label: 'Stock', numeric: true },
  { key: 'landed', label: 'Landed', numeric: true },
  { key: 'sell', label: 'Sell', numeric: true },
  { key: 'margin', label: 'Margin', numeric: true },
  { key: 'lead', label: 'Lead', numeric: true },
]

/** Ascending is ▾ here, matching the reference's default "Item ▾". */
const indicator = (column: SortColumn) => {
  if (props.sortColumn !== column) return ''
  return props.sortDirection === 'asc' ? ' ▾' : ' ▴'
}

const ariaSort = (column: SortColumn) => {
  if (props.sortColumn !== column) return 'none'
  return props.sortDirection === 'asc' ? 'ascending' : 'descending'
}

/** Enough blocks to fill the first screenful. */
const SKELETON_ROWS = 8
</script>

<template>
  <div class="catalogue-table" role="table" aria-label="Catalogue">
    <div class="header" role="row">
      <button
        v-for="column in COLUMNS"
        :key="column.key"
        type="button"
        class="header-cell"
        :class="{ 'header-cell--num': column.numeric }"
        role="columnheader"
        :aria-sort="ariaSort(column.key)"
        @click="$emit('sort', column.key)"
      >
        <SText type="column-header">{{ column.label }}{{ indicator(column.key) }}</SText>
      </button>
    </div>

    <div v-if="loading" class="rows" aria-hidden="true">
      <div v-for="index in SKELETON_ROWS" :key="index" class="skeleton-row">
        <span class="skeleton-bar skeleton-bar--name" />
        <span class="skeleton-bar" />
        <span class="skeleton-bar skeleton-bar--num" />
        <span class="skeleton-bar skeleton-bar--num" />
        <span class="skeleton-bar skeleton-bar--num" />
        <span class="skeleton-bar skeleton-bar--num" />
        <span class="skeleton-bar skeleton-bar--num" />
      </div>
    </div>

    <div v-else class="rows" role="rowgroup">
      <CatalogueTableRow
        v-for="item in items"
        :key="item.id"
        :item="item"
        :query="query"
        @open="$emit('open', item)"
      />
    </div>
  </div>
</template>

<style scoped>
.header {
  display: grid;
  grid-template-columns: 2.6fr 1fr 0.9fr 1fr 1fr 0.9fr 0.7fr;
  gap: 14px;
  padding: 10px 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
  /* Sticks while scanning; the frame clips it at its own edges. */
  position: sticky;
  top: 0;
  z-index: 1;
}

.header-cell {
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}

.header-cell--num {
  text-align: right;
}

.header-cell:hover :deep(.s-text) {
  color: var(--color-fg);
}

.header-cell:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

/* Skeleton rows: surface blocks at the real row height, no shimmer. */
.skeleton-row {
  display: grid;
  grid-template-columns: 2.6fr 1fr 0.9fr 1fr 1fr 0.9fr 0.7fr;
  gap: 14px;
  padding: 13px 20px;
  border-bottom: 1px solid var(--color-divider);
  align-items: center;
}

.skeleton-bar {
  height: 14px;
  background: var(--color-surface);
  border-radius: var(--radius-flag);
}

.skeleton-bar--name {
  width: 70%;
}

.skeleton-bar--num {
  justify-self: end;
  width: 56%;
}
</style>
