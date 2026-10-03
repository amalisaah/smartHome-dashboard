<script setup lang="ts">
import { SText } from '@/components/atoms'
import CustomerTableRow from './CustomerTableRow.vue'
import type {
  CustomerRow,
  CustomerSort,
  CustomerSortColumn,
  LoggedContact,
} from '@/types/customers'

const props = defineProps<{
  rows: CustomerRow[]
  query: string
  loading: boolean
  sort: CustomerSort
  /** The session's log state, by row id. */
  logged: Map<number, LoggedContact>
}>()

defineEmits<{
  sort: [column: CustomerSortColumn]
  open: [row: CustomerRow]
  spoke: [row: CustomerRow]
}>()

/**
 * Two of the six are orderings. The other four are never read down, so their
 * headers are labels and say so by not being buttons.
 */
const COLUMNS: { label: string; sortable: CustomerSortColumn | null; align?: 'right' }[] = [
  { label: 'Customer', sortable: 'name' },
  { label: 'Status', sortable: null },
  { label: 'Stage', sortable: null },
  { label: 'Quiet for', sortable: 'quiet' },
  { label: 'Notes', sortable: null },
  { label: 'Contact', sortable: null, align: 'right' },
]

/**
 * Descending is ▾: the reference's default `Quiet for ▾` puts the longest
 * silence on top. The opposite of the catalogue's table, whose own handoff draws
 * `Item ▾` over an A-first column — the two references disagree, and each screen
 * follows its own.
 */
const indicator = (column: CustomerSortColumn | null) => {
  if (!column || props.sort.column !== column) return ''
  return props.sort.direction === 'desc' ? ' ▾' : ' ▴'
}

const ariaSort = (column: CustomerSortColumn | null) => {
  if (!column) return undefined
  if (props.sort.column !== column) return 'none'
  return props.sort.direction === 'asc' ? 'ascending' : 'descending'
}

/** Enough to fill the first screenful. */
const SKELETON_ROWS = 7
</script>

<template>
  <div class="customer-table" role="table" aria-label="Customers">
    <div class="header" role="row">
      <component
        :is="column.sortable ? 'button' : 'span'"
        v-for="column in COLUMNS"
        :key="column.label"
        :type="column.sortable ? 'button' : undefined"
        class="header-cell"
        :class="{
          'header-cell--sortable': column.sortable,
          'header-cell--right': column.align === 'right',
        }"
        role="columnheader"
        :aria-sort="ariaSort(column.sortable)"
        @click="column.sortable && $emit('sort', column.sortable)"
      >
        <SText type="column-header" color="micro">
          {{ column.label }}{{ indicator(column.sortable) }}
        </SText>
      </component>
    </div>

    <!-- Surface blocks at the real row height. No shimmer. -->
    <div v-if="loading" class="rows" aria-hidden="true">
      <div v-for="index in SKELETON_ROWS" :key="index" class="skeleton-row">
        <span class="skeleton-bar skeleton-bar--name" />
        <span class="skeleton-bar skeleton-bar--chip" />
        <span class="skeleton-bar" />
        <span class="skeleton-bar skeleton-bar--chip" />
        <span class="skeleton-bar" />
        <span class="skeleton-bar skeleton-bar--button" />
      </div>
    </div>

    <div v-else-if="rows.length === 0 && query.trim()" class="empty" role="row">
      <SText type="cell" color="fg-2" role="cell">
        Nobody matches "{{ query.trim() }}" — by name or phone, across everyone.
      </SText>
    </div>

    <div v-else class="rows" role="rowgroup">
      <CustomerTableRow
        v-for="row in rows"
        :key="row.id"
        :row="row"
        :query="query"
        :logged="logged.get(row.id) ?? null"
        @open="$emit('open', row)"
        @spoke="$emit('spoke', row)"
      />
    </div>
  </div>
</template>

<style scoped>
/* Declared once for the header, the rows and the skeleton: custom properties
   inherit through the DOM, so the row component reads it. */
.customer-table {
  --customer-columns: 1.5fr 0.9fr 1.1fr 1fr 2.2fr 1.1fr;
}

.header {
  display: grid;
  grid-template-columns: var(--customer-columns);
  gap: 16px;
  padding: 10px 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
  /* Sticks while he scans down. */
  position: sticky;
  top: 0;
  z-index: 1;
}

.header-cell {
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  font: inherit;
}

.header-cell--sortable {
  cursor: pointer;
}

.header-cell--right {
  text-align: right;
}

.header-cell--sortable:hover :deep(.s-text) {
  color: var(--color-fg);
}

.header-cell--sortable:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

.skeleton-row {
  display: grid;
  grid-template-columns: var(--customer-columns);
  gap: 16px;
  padding: 12px 20px;
  min-height: 60px;
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

.skeleton-bar--chip {
  width: 52%;
}

.skeleton-bar--button {
  height: 36px;
  width: 92px;
  justify-self: end;
  border-radius: var(--radius-md);
}

/* On the row gutter, not an illustration in the middle of an empty frame. */
.empty {
  padding: 32px 20px;
  border-bottom: 1px solid var(--color-divider);
}
</style>
