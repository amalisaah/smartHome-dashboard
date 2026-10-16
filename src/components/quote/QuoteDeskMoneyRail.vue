<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import QuoteEditBar from './QuoteEditBar.vue'
import QuoteMoneyBoxes from './QuoteMoneyBoxes.vue'
import { formatCurrency } from '@/utils/format'
import type { ChargesDraft, QuoteMoney } from '@/types/quote'

/**
 * The right rail: the two money boxes, and the card he acts from.
 *
 * The send card is pinned to the bottom of the rail rather than following the
 * boxes, because it is the end of the screen in the sense that matters — the
 * last thing, whatever is above it.
 *
 * `Mark sent` is **stubbed**: sending is out of scope in this handoff, and a
 * button that quietly did it would freeze the quote's prices.
 */
defineProps<{
  money: QuoteMoney
  charges: ChargesDraft
  itemised: boolean
  labourMissing: boolean
  editing: boolean
  dirty: boolean
  changeCount: number
  submitting: boolean
  submitError: string | null
}>()

const emit = defineEmits<{
  charge: [field: keyof ChargesDraft, value: string]
  'update:itemised': [value: boolean]
  her: []
  send: []
  edit: []
  reset: []
  submit: []
}>()
</script>

<template>
  <aside class="rail">
    <QuoteMoneyBoxes
      :money="money"
      :charges="charges"
      :itemised="itemised"
      figures="inline"
      :editable="editing"
      @charge="(field, value) => emit('charge', field, value)"
      @update:itemised="emit('update:itemised', $event)"
    />

    <div class="send">
      <QuoteEditBar
        :editing="editing"
        :dirty="dirty"
        :change-count="changeCount"
        :submitting="submitting"
        :error="submitError"
        @edit="emit('edit')"
        @reset="emit('reset')"
        @submit="emit('submit')"
      />

      <div class="rule" />

      <div class="proposed">
        <SText type="micro">Proposed</SText>
        <SText type="figure">{{ formatCurrency(money.proposedPesewas) }}</SText>
      </div>

      <!-- The refusal, stated as the consequence and in the row that has the
           problem, rather than as a banner somewhere else. -->
      <SText v-if="labourMissing" type="caption" color="risk">
        Labour not set. Sending will be refused until you type it.
      </SText>

      <div class="buttons">
        <SButton variant="secondary" size="md" @click="emit('send')">Mark sent</SButton>
        <button type="button" class="her" @click="emit('her')">
          <SText type="app-title" class="her-label">Show her</SText>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 20px 0;
  background: var(--color-surface);
  border-left: 1px solid var(--color-line);
  overflow-y: auto;
  /* Scroll room beneath the sticky card. */
  padding-bottom: 20px;
}

/*
 * The card he acts from, and it must never be the thing he has to go looking
 * for.
 *
 * `margin-top: auto` alone puts it at the end of the rail's *scroll*, which on
 * a 768px laptop means Edit, Reset and Submit sit ~85px below the fold inside a
 * column most people never think to scroll — the buttons may as well not exist.
 * Sticking it to the bottom of the scrollport keeps it on screen whatever the
 * height, with the money boxes scrolling behind it.
 */
.send {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  position: sticky;
  bottom: 0;
  z-index: 1;
  padding: 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  /* It is over the boxes now, so it says so rather than appearing to sit in
     the same plane as them. */
  box-shadow: var(--shadow-elev-1);
}

.rule {
  height: 1px;
  background: var(--color-divider);
}

.proposed {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  white-space: nowrap;
}

.buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* Dark, because it looks like the screen it opens. */
.her {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  background: var(--color-customer-bg);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.her:active {
  transform: translateY(1px);
}

.her:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

.her-label {
  color: var(--color-customer-fg);
}
</style>
