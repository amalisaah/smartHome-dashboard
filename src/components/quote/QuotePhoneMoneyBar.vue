<script setup lang="ts">
import { SText } from '@/components/atoms'
import { formatCurrency, formatMoneyWhole } from '@/utils/format'
import type { QuoteMoney } from '@/types/quote'

/**
 * Pinned to the bottom, and always there: the number he is about to say out
 * loud, what he stands to make on it, and the way to turn the phone round.
 *
 * **His money stays light here.** Everywhere else in this app a money card is
 * dark; on this surface dark has been given a different job — it means *hers* —
 * so the profit button is light with an amber edge instead. Two meanings for one
 * treatment on the one screen where a mistake costs him the negotiation is not
 * worth the consistency.
 *
 * The `Show her` button is the exception that proves it: it is dark because it
 * looks like the screen it opens.
 */
defineProps<{ money: QuoteMoney; labourMissing: boolean }>()
defineEmits<{ money: []; her: [] }>()
</script>

<template>
  <div class="bar">
    <div class="proposed">
      <SText type="micro">Proposed</SText>
      <SText type="total">{{ formatCurrency(money.proposedPesewas) }}</SText>
      <!-- Said here because this is where he is looking when he says the
           number, and sending will refuse it. -->
      <SText v-if="labourMissing" type="cell-meta" color="risk">labour not set</SText>
    </div>

    <button type="button" class="profit" @click="$emit('money')">
      <SText type="micro" color="risk">Profit</SText>
      <SText type="list-figure">{{ formatCurrency(money.profitPesewas) }}</SText>
      <SText type="cell-meta" color="fg-2">floor {{ formatMoneyWhole(money.costPesewas) }}</SText>
    </button>

    <button type="button" class="her" @click="$emit('her')">
      <SText type="app-title" class="her-label">Show her</SText>
      <SText type="hint" class="her-hint">one tap</SText>
    </button>
  </div>
</template>

<style scoped>
.bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: stretch;
  padding: 12px 12px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  flex: none;
}

.proposed {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding-left: 4px;
  min-width: 0;
}

.profit {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding: 8px 12px;
  min-height: 56px;
  background: var(--color-bg);
  /* Amber edge, not a dark card: on this screen dark is reserved for hers. */
  border: 1px solid var(--color-risk);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: background-color 120ms ease-out;
}

.profit:hover {
  background: var(--color-row-hover-risk);
}

.profit:active {
  transform: translateY(1px);
}

.profit:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.her {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 14px;
  min-height: 56px;
  /* It looks like the screen it opens. */
  background: var(--color-customer-bg);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.her:active {
  transform: translateY(1px);
}

.her:focus-visible {
  outline: 2px solid var(--color-action-on-dark);
  outline-offset: 2px;
}

.her-label {
  color: var(--color-customer-fg);
  white-space: nowrap;
}

.her-hint {
  color: var(--color-customer-fg-2);
}
</style>
