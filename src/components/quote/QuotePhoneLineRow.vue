<script setup lang="ts">
import { computed } from 'vue'
import { SInput, SText } from '@/components/atoms'
import QuoteNeedChips from './QuoteNeedChips.vue'
import QuoteStepper from './QuoteStepper.vue'
import { formatMoney } from '@/utils/format'
import type { QuoteLine } from '@/types/quote'

/**
 * One line, and everything he can do to it.
 *
 * Tapping the row opens it; only one is open at a time, because the screen is
 * 390px wide and two open rows would put the thing he is editing off the bottom.
 *
 * The stock line is amber and says the wait, not the shortfall: a quote reserves
 * nothing, so this is never a refusal — it is the difference between a job next
 * week and one next month, which is what she is actually deciding about.
 */
const props = defineProps<{
  line: QuoteLine
  defaultNeed: string | null
  expanded: boolean
}>()

defineEmits<{
  toggle: []
  step: [by: 1 | -1]
  need: [need: string]
  note: [note: string]
  off: []
}>()

const name = computed(() => props.line.itemName ?? 'Untitled item')

/** `×2 · switching`, and `· set by you` when the need is not the group's. */
const meta = computed(() => {
  const own = props.defaultNeed !== null && props.line.need !== props.defaultNeed
  return `×${props.line.quantity} · ${props.line.need}${own ? ' · set by you' : ''}`
})

const stock = computed(() => {
  const warning = props.line.stock
  if (!warning) return null
  const lead = warning.leadDays === null ? '' : ` · ${warning.leadDays} d lead`
  return warning.stockOnHand === 0
    ? `not held${lead}`
    : `only ${warning.stockOnHand} held${lead}`
})
</script>

<template>
  <div class="line">
    <button type="button" class="row" :aria-expanded="expanded" @click="$emit('toggle')">
      <span class="left">
        <SText type="list-title" as="span">{{ name }}</SText>
        <SText type="cell-meta" color="fg-2">{{ meta }}</SText>
        <SText v-if="stock" type="cell-meta" color="risk">{{ stock }}</SText>
        <SText v-if="line.note" type="row-meta" class="note">“{{ line.note }}”</SText>
      </span>
      <span class="right">
        <SText type="list-figure">{{ formatMoney(line.totalPesewas) }}</SText>
        <SText type="cell-meta" color="fg-2">cost {{ formatMoney(line.costPesewas) }}</SText>
      </span>
    </button>

    <div v-if="expanded" class="editor">
      <div class="field-row">
        <SText type="row-meta">Quantity</SText>
        <QuoteStepper :value="line.quantity" :label="name" phone @step="$emit('step', $event)" />
      </div>

      <div class="field-stack">
        <SText type="row-meta">
          Need · from its group, change if you solved it differently
        </SText>
        <QuoteNeedChips
          :value="line.need"
          :default-need="defaultNeed"
          @pick="$emit('need', $event)"
        />
      </div>

      <SInput
        :model-value="line.note ?? ''"
        size="phone"
        placeholder="Note — optional, e.g. no neutral in the box"
        :aria-label="`Note, ${name}`"
        @update:model-value="$emit('note', $event)"
      />

      <!-- Switching off, not deleting. It leaves every total and her view, and
           keeps its date so it can come back when she changes her mind. -->
      <button type="button" class="off" @click="$emit('off')">
        <SText type="ui">Switch this line off · she said no</SText>
      </button>
    </div>
  </div>
</template>

<style scoped>
.line {
  border-bottom: 1px solid var(--color-divider);
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  min-height: 56px;
  background: transparent;
  border: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.row:active {
  background: var(--color-surface);
}

.row:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex: none;
}

.note {
  font-style: italic;
  line-height: 1.4;
}

.editor {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 16px 16px;
  background: var(--color-surface);
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
}

.field-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.off {
  min-height: var(--hit-min);
  color: var(--color-fg-2);
  background: transparent;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 120ms ease-out, background-color 120ms ease-out;
}

.off:hover {
  border-color: var(--color-fg-3);
}

.off:active {
  background: var(--color-bg);
}

.off:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}
</style>
