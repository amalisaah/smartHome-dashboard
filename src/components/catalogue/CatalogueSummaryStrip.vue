<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import type { DraftShipmentSummary } from '@/types/catalogue'
import { formatCount, formatCurrency } from '@/utils/format'

const props = defineProps<{
  loading: boolean
  capitalInStock: number
  unitsInStock: number
  retailValue: number
  restockCount: number
  longestRestockLead: number
  drafts: DraftShipmentSummary
}>()

defineEmits<{ logShipment: []; openDraft: [] }>()

const draftCaption = () => {
  const { count, nextArrival } = props.drafts
  if (count === 0) return 'No draft shipments'
  const noun = count === 1 ? 'draft shipment' : 'draft shipments'
  const verb = count === 1 ? 'arriving' : 'next arrives'
  return `${count} ${noun} · ${verb} ${nextArrival}`
}
</script>

<template>
  <div class="strip">
    <div class="cell">
      <SText type="micro" color="micro">Capital in stock</SText>
      <div v-if="loading" class="figure-skeleton" aria-hidden="true" />
      <SText v-else type="figure">{{ formatCurrency(capitalInStock) }}</SText>
      <SText type="caption">at landed cost · {{ formatCount(unitsInStock) }} units</SText>
    </div>

    <div class="cell">
      <SText type="micro" color="micro">Worth if it all sells</SText>
      <div v-if="loading" class="figure-skeleton" aria-hidden="true" />
      <SText v-else type="figure">{{ formatCurrency(retailValue) }}</SText>
      <SText type="caption">at current selling prices</SText>
    </div>

    <div class="cell">
      <SText type="micro" color="micro">Needs restocking</SText>
      <div v-if="loading" class="figure-skeleton" aria-hidden="true" />
      <SText v-else type="figure" color="risk">{{ restockCount }} items</SText>
      <SText type="caption">longest lead time {{ longestRestockLead }} days</SText>
    </div>

    <div class="cell cell--action">
      <SButton size="md" @click="$emit('logShipment')">Log a shipment</SButton>
      <button type="button" class="draft-link" @click="$emit('openDraft')">
        <SText type="caption">{{ draftCaption() }}</SText>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* The 1px gap is the divider. */
.strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 20px;
  background: var(--color-bg);
}

.cell--action {
  gap: 8px;
  padding: 16px 20px;
  background: var(--color-surface);
  justify-content: center;
}

.draft-link {
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}

.draft-link:hover :deep(.s-text) {
  color: var(--color-action);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.draft-link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}

/* Skeleton at the real figure height — a block, no shimmer. */
.figure-skeleton {
  height: 31px;
  width: 60%;
  background: var(--color-surface);
  border-radius: var(--radius-flag);
}

/* Below ~1100px the strip drops to two columns and the action cell keeps its
   own row. */
@media (max-width: 1100px) {
  .strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cell:nth-child(3),
  .cell--action {
    grid-column: 1 / -1;
  }

  .cell--action {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
  }
}
</style>
