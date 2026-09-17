<script setup lang="ts">
import { computed } from 'vue'
import { SButton, SText } from '@/components/atoms'
import type { CatalogueSummary } from '@/types/catalogue'
import { formatCount, formatCurrency, formatShortDate } from '@/utils/format'

const props = defineProps<{
  loading: boolean
  summary: CatalogueSummary
}>()

defineEmits<{ logShipment: []; openDraft: [] }>()

/** `longest_restock_lead_days` is null when nothing is low, or none of it has a lead time. */
const restockCaption = computed(() => {
  const { restockCount, longestRestockLead } = props.summary
  if (restockCount === 0) return 'nothing below its reorder level'
  if (longestRestockLead === null) return 'no lead times recorded'
  return `longest lead time ${longestRestockLead} days`
})

/** `next_draft_eta` is null when no draft has a quoted date or a lead time to go on. */
const draftCaption = computed(() => {
  const { draftShipmentCount: count, nextDraftEta } = props.summary
  if (count === 0) return 'No draft shipments'
  const noun = count === 1 ? 'draft shipment' : 'draft shipments'
  if (nextDraftEta === null) return `${count} ${noun} · no arrival date`
  const verb = count === 1 ? 'arriving' : 'next arrives'
  return `${count} ${noun} · ${verb} ${formatShortDate(nextDraftEta)}`
})
</script>

<template>
  <div class="strip">
    <div class="cell">
      <SText type="micro" color="micro">Capital in stock</SText>
      <div v-if="loading" class="figure-skeleton" aria-hidden="true" />
      <SText v-else type="figure">{{ formatCurrency(summary.capitalInStockPesewas) }}</SText>
      <SText type="caption">
        at landed cost · {{ formatCount(summary.unitsInStock) }} units
      </SText>
    </div>

    <div class="cell">
      <SText type="micro" color="micro">Worth if it all sells</SText>
      <div v-if="loading" class="figure-skeleton" aria-hidden="true" />
      <SText v-else type="figure">{{ formatCurrency(summary.retailValuePesewas) }}</SText>
      <SText type="caption">at current selling prices</SText>
    </div>

    <div class="cell">
      <SText type="micro" color="micro">Needs restocking</SText>
      <div v-if="loading" class="figure-skeleton" aria-hidden="true" />
      <SText v-else type="figure" color="risk">{{ summary.restockCount }} items</SText>
      <SText type="caption">{{ restockCaption }}</SText>
    </div>

    <div class="cell cell--action">
      <SButton size="md" @click="$emit('logShipment')">Log a shipment</SButton>
      <button type="button" class="draft-link" @click="$emit('openDraft')">
        <SText type="caption">{{ draftCaption }}</SText>
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
