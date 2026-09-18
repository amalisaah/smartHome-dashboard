<script setup lang="ts">
import { SText } from '@/components/atoms'
import ShipmentCostRow from './ShipmentCostRow.vue'
import ShipmentTotalBlock from './ShipmentTotalBlock.vue'
import type { SharedCost } from '@/types/shipment'
import { formatCedi, formatCount } from '@/utils/format'

const props = defineProps<{
  costs: SharedCost[]
  editingCostId: number | null
  isBlankCost: (cost: SharedCost) => boolean
  costCount: number
  sharedPesewas: number
  totalPesewas: number
  sharedPercent: number
}>()

const emit = defineEmits<{
  'update:cost': [cost: SharedCost]
  edit: [id: number]
  leave: []
  remove: [id: number]
  preview: []
}>()

const isLast = (index: number) => index === props.costs.length - 1
</script>

<template>
  <div class="pane">
    <div class="pane-header">
      <SText type="pane-title">Shared costs</SText>
      <!-- No fixed freight / duty / other fields: he names his own. -->
      <SText type="hint">you name them</SText>
    </div>

    <div class="head" role="row">
      <SText type="column-header" color="micro">Label</SText>
      <SText type="column-header" color="micro" class="num">GH₵</SText>
      <span />
    </div>

    <ShipmentCostRow
      v-for="(cost, index) in costs"
      :key="cost.id"
      :cost="cost"
      :editing="cost.id === editingCostId"
      :blank="isBlankCost(cost)"
      :last="isLast(index)"
      @update:cost="emit('update:cost', $event)"
      @edit="emit('edit', cost.id)"
      @leave="emit('leave')"
      @remove="emit('remove', cost.id)"
    />

    <div class="foot">
      <SText type="cell-meta">{{ formatCount(costCount) }} shared costs</SText>
      <SText type="list-figure">{{ formatCedi(sharedPesewas) }}</SText>
    </div>

    <ShipmentTotalBlock
      :total-pesewas="totalPesewas"
      :shared-percent="sharedPercent"
      @preview="emit('preview')"
    />
  </div>
</template>

<style scoped>
.pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pane-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 10px;
}

.head {
  display: grid;
  grid-template-columns: 1.6fr 1fr 24px;
  gap: 10px;
  padding: 8px 20px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.num {
  text-align: right;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--color-surface);
}
</style>
