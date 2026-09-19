<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { SText } from '@/components/atoms'
import ShipmentLineCreateRow from './ShipmentLineCreateRow.vue'
import ShipmentLineRow from './ShipmentLineRow.vue'
import type { InvoiceLine } from '@/types/shipment'
import { currencySymbol, formatCedi, formatCount, formatInvoice } from '@/utils/format'

const props = defineProps<{
  lines: InvoiceLine[]
  items: { id: number; name: string }[]
  currency: string
  /** Minor units of the invoice currency. */
  subtotal: number
  productPesewas: number
  unitCount: number
  lineTotal: (line: InvoiceLine) => number
  /** The line whose Qty field should take the caret, once it exists. */
  focusLineId: number | null
}>()

const emit = defineEmits<{
  'update:line': [line: InvoiceLine]
  pick: [name: string, itemId: number | null]
  focused: []
}>()

const rows = ref<InstanceType<typeof ShipmentLineRow>[]>([])
const createRow = ref<InstanceType<typeof ShipmentLineCreateRow> | null>(null)

/**
 * A created line keeps the caret in the table and moves it to Qty. Entering a
 * line must never navigate away, open a modal, or lose the caret's place.
 */
watch(
  () => props.focusLineId,
  async (id) => {
    if (id === null) return
    await nextTick()
    const index = props.lines.findIndex((line) => line.id === id)
    rows.value[index]?.focusQty()
    emit('focused')
  },
)

/** Enter in the last field commits the row and opens the blank one below. */
const onCommit = () => createRow.value?.focus()
</script>

<template>
  <div class="pane">
    <div class="pane-header">
      <SText type="pane-title">Invoice lines</SText>
      <!-- The currency is stated once, here and in the column heads. -->
      <SText type="hint">prices as invoiced, in {{ currency }}</SText>
    </div>

    <div class="head" role="row">
      <SText type="column-header" color="micro">Item</SText>
      <SText type="column-header" color="micro" class="num">Qty</SText>
      <SText type="column-header" color="micro" class="num">Unit {{ currencySymbol(currency) }}</SText>
      <SText type="column-header" color="micro" class="num">Line {{ currencySymbol(currency) }}</SText>
    </div>

    <ShipmentLineRow
      v-for="line in lines"
      :key="line.id"
      ref="rows"
      :line="line"
      :total="lineTotal(line)"
      @update:line="emit('update:line', $event)"
      @commit="onCommit"
    />

    <ShipmentLineCreateRow
      ref="createRow"
      :items="items"
      @pick="(name, itemId) => emit('pick', name, itemId)"
    />

    <div class="foot">
      <SText type="cell-meta">
        {{ formatCount(lines.length) }} lines · {{ formatCount(unitCount) }} units
      </SText>
      <span class="totals">
        <SText type="money" color="fg-2-soft">{{ formatInvoice(subtotal, currency) }}</SText>
        <SText type="list-figure">{{ formatCedi(productPesewas) }}</SText>
      </span>
    </div>
  </div>
</template>

<style scoped>
.pane {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-line);
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
  grid-template-columns: 2.6fr 0.7fr 1fr 1fr;
  gap: 12px;
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

.totals {
  display: flex;
  align-items: baseline;
  gap: 24px;
}
</style>
