<script setup lang="ts">
import { SText } from '@/components/atoms'
import { SORT_COLUMN_LABELS } from '@/composables/useCatalogueList'
import type { SortColumn } from '@/types/catalogue'
import { formatCount } from '@/utils/format'

defineProps<{
  totalCount: number
  groupCount: number
  sortColumn: SortColumn
}>()

defineEmits<{ addItem: [] }>()
</script>

<template>
  <div class="footer">
    <SText type="cell-meta">
      {{ formatCount(totalCount) }} items · {{ groupCount }} groups · sorted by
      {{ SORT_COLUMN_LABELS[sortColumn] }}
    </SText>
    <!-- Deliberately the least prominent path: items are normally born from a
         shipment. -->
    <button type="button" class="add-link" @click="$emit('addItem')">
      <SText type="cell-meta">Add one item manually</SText>
    </button>
  </div>
</template>

<style scoped>
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
}

.add-link {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.add-link:hover :deep(.s-text) {
  color: var(--color-action);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.add-link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}
</style>
