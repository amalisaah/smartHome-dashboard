<script setup lang="ts">
import { ref } from 'vue'
import { SBadge, SInput, SText } from '@/components/atoms'
import type { InvoiceLine } from '@/types/shipment'
import { formatMoney } from '@/utils/format'

const props = defineProps<{
  line: InvoiceLine
  /** Minor units of the invoice currency — qty × unit price. */
  total: number
}>()

const emit = defineEmits<{
  'update:line': [line: InvoiceLine]
  /** Enter in the last field: this row is done, open the next one. */
  commit: []
}>()

const qtyField = ref<InstanceType<typeof SInput> | null>(null)

const patch = (fields: Partial<InvoiceLine>) => emit('update:line', { ...props.line, ...fields })

defineExpose({ focusQty: () => qtyField.value?.focus() })
</script>

<template>
  <div class="row" :class="{ 'row--new': line.isNew }">
    <span class="cell cell--name">
      <SText type="cell">{{ line.itemName }}</SText>
      <!-- Not in the catalogue yet; receiving is what will put it there. -->
      <SBadge v-if="line.isNew" variant="accepted" size="row">new item</SBadge>
    </span>

    <span class="cell cell--num">
      <SInput
        ref="qtyField"
        variant="flat"
        mono
        align="right"
        aria-label="Quantity"
        :model-value="line.qty"
        @update:model-value="patch({ qty: $event })"
      />
    </span>

    <span class="cell cell--num">
      <SInput
        variant="flat"
        mono
        align="right"
        aria-label="Unit price"
        :model-value="line.unitPrice"
        @update:model-value="patch({ unitPrice: $event })"
        @keydown.enter.prevent="$emit('commit')"
      />
    </span>

    <!-- The line total is the two fields beside it, so it is never typed. -->
    <SText type="money" class="cell--num">{{ formatMoney(total) }}</SText>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 2.6fr 0.7fr 1fr 1fr;
  gap: 12px;
  padding: 11px 20px;
  border-bottom: 1px solid var(--color-divider);
  align-items: center;
}

/* A field's own intrinsic width must not widen a column, or the row's figures
   stop lining up under the head's. The columns are the ratio, nothing else. */
.row > * {
  min-width: 0;
}

/* An item this shipment invents tints, so the new names stand out while the
   invoice is being read off paper. */
.row--new {
  background: var(--color-row-action-tint);
}

.cell--name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cell--num {
  text-align: right;
}
</style>
