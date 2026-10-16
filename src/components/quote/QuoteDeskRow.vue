<script setup lang="ts">
import { computed } from 'vue'
import { SInput, SText } from '@/components/atoms'
import QuoteNeedSelect from './QuoteNeedSelect.vue'
import QuoteStepper from './QuoteStepper.vue'
import { formatMoney } from '@/utils/format'
import type { QuoteLine } from '@/types/quote'

/**
 * One line at the desk. Everything is edited **in the row** — there is no
 * expanding and no dialog, because the laptop has the width to show the whole
 * line and the keyboard to move along it.
 *
 * Tab order follows the eye: need, then quantity, then the note, then the way to
 * switch it off.
 */
const props = defineProps<{
  line: QuoteLine
  defaultNeed: string | null
  /** False while the quote is being read rather than changed. */
  editable?: boolean
}>()

defineEmits<{
  step: [by: 1 | -1]
  need: [need: string]
  note: [note: string]
  off: []
}>()

const name = computed(() => props.line.itemName ?? 'Untitled item')

const stock = computed(() => {
  const warning = props.line.stock
  if (!warning) return null
  const lead = warning.leadDays === null ? '' : ` · ${warning.leadDays} d lead`
  return warning.stockOnHand === 0 ? `not held${lead}` : `only ${warning.stockOnHand} held${lead}`
})
</script>

<template>
  <div class="row">
    <span class="item">
      <SText type="ui" as="span">{{ name }}</SText>
      <SText v-if="stock" type="cell-meta" color="risk">{{ stock }}</SText>
    </span>

    <QuoteNeedSelect
      :value="line.need"
      :default-need="defaultNeed"
      :label="name"
      :disabled="!editable"
      @pick="$emit('need', $event)"
    />

    <div class="qty">
      <QuoteStepper
        :value="line.quantity"
        :label="name"
        :disabled="!editable"
        @step="$emit('step', $event)"
      />
    </div>

    <span class="total">
      <SText type="count">{{ formatMoney(line.totalPesewas) }}</SText>
      <SText type="cell-meta" color="fg-2">@ {{ formatMoney(line.unitPricePesewas) }}</SText>
    </span>

    <SText type="money" color="fg-2" class="cost">{{ formatMoney(line.costPesewas) }}</SText>

    <!-- Flat, so a column of notes reads as notes and not as a row of boxes.
         The cell carries `min-width: 0` or the field's intrinsic width would
         widen the column and the row would stop lining up under the head. -->
    <div class="note">
      <SInput
        :model-value="line.note ?? ''"
        variant="flat"
        :disabled="!editable"
        placeholder="—"
        :aria-label="`Note, ${name}`"
        @update:model-value="$emit('note', $event)"
      />
    </div>

    <button v-if="editable" type="button" class="off" @click="$emit('off')">
      <SText type="label" as="span" color="fg-2">Switch off</SText>
    </button>
    <span v-else />
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: minmax(200px, 2fr) 120px 120px 96px 80px minmax(0, 1fr) 84px;
  gap: 12px;
  align-items: center;
  padding: 10px 24px;
  border-bottom: 1px solid var(--color-divider);
}

.item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.qty {
  justify-self: center;
}

.total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.cost {
  text-align: right;
}

.note {
  min-width: 0;
}

.off {
  background: transparent;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: 6px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 120ms ease-out;
}

.off:hover {
  border-color: var(--color-fg-3);
}

.off:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}
</style>
