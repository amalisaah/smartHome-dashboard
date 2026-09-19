<script setup lang="ts">
import { computed } from 'vue'
import { SBadge, SText } from '@/components/atoms'
import type { ShipmentListRow } from '@/types/shipment'
import { formatCount, formatMoney, formatShortDate } from '@/utils/format'

const props = defineProps<{ row: ShipmentListRow }>()

defineEmits<{ open: [] }>()

const draft = computed(() => props.row.state === 'draft')

/**
 * The chip is the only place state is expressed — dashed for a draft, solid for
 * one that has landed, and it says what it means in words rather than colour.
 */
const stateLabel = computed(() => {
  const date = props.row.stateDate
  if (draft.value) return date ? `draft · arrives ${formatShortDate(date)}` : 'draft · no date yet'
  if (!date) return 'received'
  const received = `received ${formatShortDate(date)}`
  return props.row.splitOverridden ? `${received} · split overridden` : received
})
</script>

<template>
  <div
    class="row"
    :class="{ 'row--draft': draft }"
    role="row"
    tabindex="0"
    @click="$emit('open')"
    @keydown.enter.prevent="$emit('open')"
    @keydown.space.prevent="$emit('open')"
  >
    <SText type="ref" role="cell">{{ row.ref }}</SText>
    <SText type="cell" role="cell">{{ row.supplier }}</SText>
    <!-- A dash until the shipment's own detail has landed: the list is told the
         header, and the figures follow. -->
    <SText type="cell"  role="cell">
      {{  row.orderedAt === null ? '—' : formatShortDate(row.orderedAt) }}
    </SText>
    <SText type="money" color="fg-2" class="num" role="cell">
      {{ row.productPesewas === null ? '—' : formatMoney(row.productPesewas) }}
    </SText>
    <SText type="money" color="fg-2" class="num" role="cell">
      {{ row.sharedPesewas === null ? '—' : formatMoney(row.sharedPesewas) }}
    </SText>
    <span class="cell cell--state" role="cell">
      <SBadge :variant="draft ? 'draft' : 'received'" size="state">{{ stateLabel }}</SBadge>
    </span>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 0.8fr 1.6fr 0.8fr 1fr 1fr 1.2fr;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-divider);
  align-items: center;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.row:last-child {
  border-bottom: none;
}

.row:hover {
  background: var(--color-surface);
}

.row:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

/* The one still open. It keeps its tint on hover and darkens a touch. */
.row--draft {
  background: var(--color-row-action-tint);
}

.row--draft:hover {
  background: var(--color-row-hover-action);
}

.cell--state {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.num {
  text-align: right;
}
</style>
