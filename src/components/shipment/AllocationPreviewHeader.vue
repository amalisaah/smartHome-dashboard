<script setup lang="ts">
import { computed } from 'vue'
import { SSegmented, SText } from '@/components/atoms'
import { BASIS_NOTES } from '@/data/shipmentCopy'
import type { AllocationBasis } from '@/types/shipment'
import { formatCedi } from '@/utils/format'

const props = defineProps<{
  /** Empty while the shipment is unsaved and has no number yet. */
  shipmentRef: string
  basis: AllocationBasis
  sharedPesewas: number
  productPesewas: number
  /** A received shipment's figures are history: nothing is pending on them. */
  readOnly?: boolean
}>()

defineEmits<{ 'update:basis': [basis: AllocationBasis] }>()

/** The wire's three, in his words. Two rules, then taking the rule off. */
const BASIS_OPTIONS: { label: string; value: AllocationBasis }[] = [
  { label: 'By value', value: 'by-value' },
  { label: 'Per unit', value: 'per-unit' },
  { label: 'Override the split', value: 'override' },
]

const subline = computed(() => {
  // An unsaved shipment has no ref to lead with; the figures still stand alone.
  const named = props.shipmentRef ? `${props.shipmentRef} · ` : ''
  const totals = `${named}${formatCedi(props.sharedPesewas)} of shared cost spread across ${formatCedi(props.productPesewas)} of product.`
  return props.readOnly
    ? totals
    : `${totals} Nothing is committed until you receive the shipment.`
})
</script>

<template>
  <div class="header">
    <div class="titles">
      <SText type="sheet-title" as="h1">What the freight did to each item</SText>
      <SText type="cell" as="p" color="fg-2-soft">{{ subline }}</SText>
    </div>

    <div class="basis">
      <SText type="micro" color="micro">Allocation basis</SText>
      <SSegmented
        size="lg"
        :model-value="basis"
        :options="BASIS_OPTIONS"
        :disabled="readOnly"
        @update:model-value="$emit('update:basis', $event)"
      />
      <SText type="caption">{{ BASIS_NOTES[basis] }}</SText>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--color-line);
}

.titles {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.basis {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex: none;
}
</style>
