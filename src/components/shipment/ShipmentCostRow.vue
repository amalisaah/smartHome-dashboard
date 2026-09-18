<script setup lang="ts">
import { ref } from 'vue'
import { SInput, SText } from '@/components/atoms'
import { toMinor, type SharedCost } from '@/types/shipment'
import { formatMoney } from '@/utils/format'

const props = defineProps<{
  cost: SharedCost
  /**
   * A row he is naming right now holds fields. A row he has finished with reads
   * as a figure with an `×` beside it — to change one, remove it and retype it
   * in the blank row below.
   */
  editing: boolean
  blank: boolean
  last: boolean
}>()

const emit = defineEmits<{
  'update:cost': [cost: SharedCost]
  edit: []
  leave: []
  remove: []
}>()

const rowEl = ref<HTMLDivElement | null>(null)

const patch = (fields: Partial<SharedCost>) => emit('update:cost', { ...props.cost, ...fields })

/** Moving between this row's two fields is not leaving it. */
function onFocusOut(event: FocusEvent) {
  if (rowEl.value?.contains(event.relatedTarget as Node)) return
  emit('leave')
}
</script>

<template>
  <div
    ref="rowEl"
    class="row"
    :class="{ 'row--last': last }"
    @focusin="$emit('edit')"
    @focusout="onFocusOut"
  >
    <template v-if="editing || blank">
      <SInput
        size="row"
        dashed
        placeholder="Name a cost…"
        aria-label="Cost name"
        :model-value="cost.label"
        @update:model-value="patch({ label: $event })"
      />
      <SInput
        size="row-figure"
        dashed
        mono
        align="right"
        placeholder="0.00"
        aria-label="Cost amount in cedis"
        :model-value="cost.amount"
        @update:model-value="patch({ amount: $event })"
      />
      <span />
    </template>

    <template v-else>
      <SText type="cell">{{ cost.label }}</SText>
      <SText type="money" class="num">{{ formatMoney(toMinor(cost.amount)) }}</SText>
      <!-- Immediate, no confirm: it can be retyped in the blank row below. -->
      <button
        type="button"
        class="remove"
        :aria-label="`Remove ${cost.label}`"
        @click="$emit('remove')"
      >
        ×
      </button>
    </template>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 1.6fr 1fr 24px;
  gap: 10px;
  padding: 9px 20px;
  border-bottom: 1px solid var(--color-divider);
  align-items: center;
}

/* A field's own intrinsic width must not widen a column. */
.row > * {
  min-width: 0;
}

/* The blank row closes the table, so its rule is the table's own. */
.row--last {
  border-bottom-color: var(--color-line);
}

.num {
  text-align: right;
}

.remove {
  padding: 0;
  border: none;
  background: none;
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1;
  text-align: right;
  color: var(--color-fg-3);
  cursor: pointer;
  transition: color 120ms ease-out;
}

.remove:hover {
  color: var(--color-risk);
}

.remove:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}
</style>
