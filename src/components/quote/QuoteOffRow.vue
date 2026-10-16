<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import { formatShortDate } from '@/utils/format'
import type { QuoteLine } from '@/types/quote'

/**
 * A line he switched off.
 *
 * It is never deleted, and this row is the proof: struck through, dated, and
 * carrying the way back. A quote is a negotiation, and what she said no to on
 * Tuesday is a thing he may need to put back on Thursday — which is also why
 * these rows are dashed rather than gone, and why they are out of every total
 * while they sit here.
 */
const props = defineProps<{ line: QuoteLine; phone?: boolean; editable?: boolean }>()
defineEmits<{ on: [] }>()

const name = computed(() => props.line.itemName ?? 'Untitled item')

const meta = computed(() => {
  const since = props.line.removedAt ? ` · off since ${formatShortDate(props.line.removedAt)}` : ''
  return `×${props.line.quantity}${since}`
})
</script>

<template>
  <div class="off-row" :class="{ 'off-row--phone': phone }">
    <span class="left" :class="{ 'left--phone': phone }">
      <SText :type="phone ? 'list-title' : 'cell'" as="span" class="name">{{ name }}</SText>
      <SText type="cell-meta" class="meta">{{ meta }}</SText>
    </span>
    <button
      v-if="editable"
      type="button"
      class="on"
      :class="{ 'on--phone': phone }"
      @click="$emit('on')"
    >
      <SText :type="phone ? 'row-meta' : 'label'" as="span" color="action">Switch on</SText>
    </button>
  </div>
</template>

<style scoped>
.off-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 24px;
  /* Dashed: not gone, just not counted. */
  border-bottom: 1px dashed var(--color-line);
  color: var(--color-fg-3);
  /* At the desk this sits in a table that scrolls sideways, so the rule runs
     the full width of the rows above it; the phone defines no floor and gets 0. */
  min-width: var(--desk-min, 0);
}

.off-row--phone {
  padding: 10px 16px;
  min-height: 56px;
}

.left {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.left--phone {
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.name,
.meta {
  color: inherit;
}

.name {
  text-decoration: line-through;
}

.on {
  background: transparent;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: 6px 10px;
  cursor: pointer;
  flex: none;
  white-space: nowrap;
  transition: border-color 120ms ease-out;
}

.on--phone {
  min-height: 44px;
  padding: 0 12px;
}

.on:hover {
  border-color: var(--color-fg-3);
}

.on:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}
</style>
