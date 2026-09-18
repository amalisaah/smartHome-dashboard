<script setup lang="ts">
import { SText } from '@/components/atoms'
import AllocationPreviewRow from './AllocationPreviewRow.vue'
import type { CatalogueGroupRef } from '@/types/catalogue'
import type { PreviewRow } from '@/types/shipment'

defineProps<{
  rows: PreviewRow[]
  /** How far a landed cost must move before its row is marked. A prop, because
   *  where that line sits is a product decision and not a UI one. */
  movedThreshold: number
  groups: CatalogueGroupRef[]
  readOnly?: boolean
}>()

defineEmits<{ 'assign-group': [rowId: number, slug: string] }>()

/**
 * The column order is the arithmetic: product value → share of the shipment →
 * cash added → new unit cost → what it now sells at. Nothing here reorders or
 * hides an intermediate step behind a toggle.
 */
const COLUMNS = [
  { label: 'Item', numeric: false },
  { label: 'Qty', numeric: true },
  { label: 'Product', numeric: true },
  { label: 'Share', numeric: true },
  { label: '+ Shared', numeric: true },
  { label: 'Landed / unit', numeric: true },
  { label: 'Sells at', numeric: true },
  { label: 'Margin', numeric: true },
]
</script>

<template>
  <div role="table" aria-label="Allocation preview">
    <div class="head" role="row">
      <SText
        v-for="column in COLUMNS"
        :key="column.label"
        type="column-header"
        color="micro"
        role="columnheader"
        :class="{ num: column.numeric }"
      >
        {{ column.label }}
      </SText>
    </div>

    <AllocationPreviewRow
      v-for="row in rows"
      :key="row.id"
      :row="row"
      :moved-threshold="movedThreshold"
      :groups="groups"
      :read-only="readOnly"
      @assign-group="$emit('assign-group', row.id, $event)"
    />
  </div>
</template>

<style scoped>
.head {
  display: grid;
  grid-template-columns: 2.2fr 0.6fr 0.9fr 0.9fr 1.1fr 1.25fr 1.25fr 0.8fr;
  gap: 12px;
  padding: 10px 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.num {
  text-align: right;
}
</style>
