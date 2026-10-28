<script setup lang="ts">
import { ref } from 'vue'
import { SBadge, SInput, SText } from '@/components/atoms'
import type { JobLineRow } from '@/types/job'
import { formatMoney } from '@/utils/format'

const props = defineProps<{
  row: JobLineRow
  /** What is in the Fitted field, which may be mid-keystroke. */
  fitted: string
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:fitted': [value: string]
  /**
   * He has left the field, or pressed Enter: send it now rather than when the
   * settle would have. `focusout` rather than `blur` — the listener lands on
   * SInput's wrapper, and blur does not bubble to it.
   */
  commit: []
  /** Enter: the caret belongs in the next row's Fitted. */
  next: []
}>()

const field = ref<InstanceType<typeof SInput> | null>(null)

defineExpose({ focus: () => field.value?.focus() })

/** Enter commits this row and moves down, rather than submitting anything. */
function onEnter() {
  emit('commit')
  emit('next')
}

/**
 * Unchanged is the quiet state and changed is the loud one, which is the
 * opposite of how a form usually works — because this screen is for correcting,
 * not entering. Eight rows that match the quote should recede; the four he
 * touched are what his three minutes are for.
 */
const changed = () => props.row.change !== null
</script>

<template>
  <div class="row" :class="{ 'row--changed': changed() }">
    <span class="cell cell--item">
      <SText type="cell" :color="changed() ? 'fg' : 'fg-2'" :class="{ weighted: changed() }">
        {{ row.itemName }}
      </SText>
      <!-- A swap: what the quote said, under what was fitted. Without it the
           chip says `swapped` and leaves him to remember swapped from what. -->
      <SText v-if="row.quotedItemName" type="cell-meta" color="fg-2">
        quoted: {{ row.quotedItemName }}
      </SText>
    </span>

    <SText type="cell-meta" color="fg-2">{{ row.need }}</SText>

    <!-- `—` rather than 0 on a line the quote never had: nothing was quoted,
         which is a different fact from a quote of none. -->
    <SText type="money" color="fg-2" class="cell--num">
      {{ row.quotedQuantity === null ? '—' : row.quotedQuantity }}
    </SText>

    <span class="cell--num">
      <!-- Dashed means system-set, solid means he edited it: the existing rule,
           and the reason a pre-filled figure needs no explaining. -->
      <SInput
        v-if="!readOnly"
        ref="field"
        class="fitted"
        mono
        align="right"
        input-mode="numeric"
        :aria-label="`Fitted — ${row.itemName}`"
        :variant="changed() ? 'accent' : 'default'"
        :dashed="!changed()"
        :model-value="fitted"
        @update:model-value="emit('update:fitted', $event)"
        @focusout="emit('commit')"
        @keydown.enter.prevent="onEnter"
      />
      <SText v-else type="money" :color="changed() ? 'fg' : 'fg-2'">{{ row.fitted }}</SText>
    </span>

    <span>
      <SBadge
        v-if="row.change"
        :variant="row.change.kind === 'missing' ? 'change-missing' : 'change'"
        size="inline"
      >
        {{ row.change.label }}
      </SBadge>
    </span>

    <SText type="money" :color="changed() ? 'fg' : 'fg-2'" class="cell--num">
      {{ formatMoney(row.chargedPesewas) }}
    </SText>

    <!-- Owner-only, and quiet in every row: the amber is on the column head,
         where it marks the whole column as his rather than hers. -->
    <SText type="money" color="fg-2" class="cell--num">{{ formatMoney(row.costPesewas) }}</SText>

    <SText type="meta" color="fg-2">{{ row.note }}</SText>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns:
    minmax(0, 2.6fr) 0.9fr 0.6fr 0.8fr 0.9fr 0.9fr 0.9fr minmax(0, 1.8fr);
  gap: 12px;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-divider);
  transition: background-color 120ms ease-out;
}

/* A field's own intrinsic width must not widen a column, or the figures stop
   lining up under the head. The columns are the ratio, nothing else. */
.row > * {
  min-width: 0;
}

/* He changed something here. The tint is the row saying so before he has read
   a single figure in it. */
.row--changed {
  background: var(--color-row-action-tint);
}

.cell--item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cell--num {
  text-align: right;
}

/* A changed line's name carries weight as well as ink — the two together are
   what make four rows findable in eleven. */
.weighted {
  font-weight: 500;
}

/* 56px, right-aligned, and no wider: it holds a count, and a field sized for
   prose in a figures column makes the column read as a form. */
.fitted {
  display: inline-flex;
  width: 56px;
  margin-left: auto;
}

.fitted :deep(.s-input) {
  padding: 6px 8px;
  font-size: 14px;
}
</style>
