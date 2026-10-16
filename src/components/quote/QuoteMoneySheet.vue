<script setup lang="ts">
import { ref } from 'vue'
import { SButton, SText } from '@/components/atoms'
import QuoteMoneyBoxes from './QuoteMoneyBoxes.vue'
import { useDialogKeys } from '@/composables/useDialogKeys'
import { formatCurrency, formatMoneyWhole } from '@/utils/format'
import type { ChargesDraft, QuoteMoney } from '@/types/quote'

/**
 * The money, on the phone: the two boxes, and under them the two figures he is
 * actually deciding against.
 *
 * Profit sits in an amber-bordered card and the floor in a plain one, because
 * they are not the same kind of fact — one is what he hopes for and one is the
 * line he must not cross. Both are supplied; neither is worked out here.
 */
defineProps<{
  money: QuoteMoney
  charges: ChargesDraft
  itemised: boolean
  editable?: boolean
}>()

const emit = defineEmits<{
  charge: [field: keyof ChargesDraft, value: string]
  'update:itemised': [value: boolean]
  close: []
}>()

const sheet = ref<HTMLElement | null>(null)
useDialogKeys(sheet, { onDismiss: () => emit('close') })
</script>

<template>
  <div class="scrim" @mousedown.self="emit('close')">
    <div ref="sheet" class="sheet" role="dialog" aria-modal="true" aria-labelledby="money-title">
      <div class="head">
        <SText id="money-title" type="heading" as="h2">Money</SText>
        <SButton variant="ghost" size="lg" @click="emit('close')">Close</SButton>
      </div>

      <QuoteMoneyBoxes
        :money="money"
        :charges="charges"
        :itemised="itemised"
        phone
        figures="none"
        :editable="editable"
        @charge="(field, value) => emit('charge', field, value)"
        @update:itemised="emit('update:itemised', $event)"
      />

      <div class="cards">
        <div class="card card--profit">
          <SText type="micro" color="risk">Expected profit</SText>
          <SText type="figure">{{ formatCurrency(money.profitPesewas) }}</SText>
          <SText type="caption" color="fg-2">
            on {{ formatCurrency(money.proposedPesewas) }} proposed
          </SText>
        </div>
        <div class="card">
          <SText type="micro">Floor</SText>
          <SText type="figure">{{ formatMoneyWhole(money.costPesewas) }}</SText>
          <SText type="caption" color="fg-2">below this you lose money</SText>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Below the band, as the picker is. */
.scrim {
  position: absolute;
  inset: 32px 0 0;
  z-index: 40;
  background: var(--color-scrim);
}

.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 88%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--color-bg);
  border-top: 1px solid var(--color-line);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  box-shadow: var(--shadow-elev-sheet);
  scrollbar-width: thin;
  scrollbar-color: var(--color-line) transparent;
  animation: sheet-up 200ms ease-out;
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet {
    animation: none;
  }
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.card--profit {
  border-color: var(--color-risk);
}
</style>
