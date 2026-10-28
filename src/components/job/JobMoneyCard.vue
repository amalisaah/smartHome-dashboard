<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SInput, SText } from '@/components/atoms'
import type { JobMoney, JobPaymentRow } from '@/types/job'
import { formatMoney, formatMoneyExact, formatMoneyWhole } from '@/utils/format'

const props = defineProps<{
  money: JobMoney
  payments: JobPaymentRow[]
  /** What is in the Charged field, which may be mid-keystroke. */
  charged: string
  /** He has moved it off the figure the quote carried. */
  chargedIsEdited: boolean
  /** What the quote said she agreed to. Null on a job with no quote. */
  quoteAgreedPesewas: number | null
  readOnly: boolean
}>()

const emit = defineEmits<{
  'update:charged': [value: string]
  commit: []
}>()

/**
 * The Owed tile is the one amber thing in this card, and only while something
 * is actually owed. Settled, it goes quiet — an amber zero is a warning about
 * nothing. Overpaid takes the action hue instead: she is ahead, which is not a
 * risk, and the label says which way round it is rather than showing a minus.
 */
const owed = computed(() => {
  if (props.money.balanceState === 'overpaid') {
    return { label: 'Overpaid', amount: Math.abs(props.money.owedPesewas), tone: 'action' as const }
  }
  if (props.money.owedPesewas === 0) {
    return { label: 'Owed', amount: 0, tone: 'settled' as const }
  }
  return { label: 'Owed', amount: props.money.owedPesewas, tone: 'risk' as const }
})

/** The payment dialog is deferred to block I, so the link says so once pressed. */
const paymentStub = ref(false)
</script>

<template>
  <section class="card">
    <SText type="heading" as="h2">Charged, received, owed</SText>

    <div class="charged">
      <span class="charged-label">
        <SText type="ui">Charged</SText>
        <!-- The quote's figure, not this field's. Once he moves the job's
             total the original has nowhere else to be said. -->
        <SText v-if="quoteAgreedPesewas !== null" type="caption">
          agreed on the quote: {{ formatMoneyExact(quoteAgreedPesewas) }}
        </SText>
        <SText v-else type="caption">no quote behind this job</SText>
      </span>

      <!-- Dashed while it is still what the quote said, solid once he has
           moved it: this is the figure she owes, and the border says whether
           it is still hers or now his. -->
      <SInput
        v-if="!readOnly"
        class="charged-field"
        mono
        align="right"
        input-mode="decimal"
        aria-label="Charged"
        :variant="chargedIsEdited ? 'accent' : 'default'"
        :dashed="!chargedIsEdited"
        :model-value="charged"
        @update:model-value="emit('update:charged', $event)"
        @focusout="emit('commit')"
      />
      <SText v-else type="list-figure">{{ formatMoneyExact(money.chargedPesewas) }}</SText>
    </div>

    <div class="payments">
      <div v-for="payment in payments" :key="payment.id" class="payment">
        <SText type="cell-meta" color="fg-2">{{ payment.paidOn }}</SText>
        <SText type="cell">
          {{ payment.method }}
          <SText v-if="payment.reference" type="cell-meta" color="fg-2" as="span">
            · {{ payment.reference }}
          </SText>
        </SText>
        <SText type="money">{{ formatMoney(payment.amountPesewas) }}</SText>
      </div>

      <!-- Kept on a completed job: a balance settling a week later is normal,
           and recording it changes no stock and no house record. -->
      <SButton variant="link" size="sm" class="add" @click="paymentStub = true">
        + Record a payment
      </SButton>
      <SText v-if="paymentStub" type="hint">
        the payment dialog is block I — method, ref, amount, date — and is not drawn yet
      </SText>
    </div>

    <div class="tiles">
      <div class="tile">
        <SText type="caption">Charged</SText>
        <SText type="list-figure">{{ formatMoneyWhole(money.chargedPesewas) }}</SText>
      </div>
      <div class="tile">
        <SText type="caption">Received</SText>
        <SText type="list-figure">{{ formatMoneyWhole(money.receivedPesewas) }}</SText>
      </div>
      <div class="tile" :class="`tile--${owed.tone}`">
        <SText type="caption" :color="owed.tone === 'settled' ? 'fg-2-soft' : owed.tone">
          {{ owed.label }}
        </SText>
        <SText
          type="list-figure"
          :color="owed.tone === 'settled' ? 'fg' : owed.tone"
          class="owed-figure"
        >
          {{ formatMoneyWhole(owed.amount) }}
        </SText>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.charged {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.charged-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.charged-field {
  width: 120px;
  flex-shrink: 0;
}

.charged-field :deep(.s-input) {
  padding: 9px 10px;
  font-size: 15px;
}

.payments {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-divider);
}

.payment {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-divider);
}

.add {
  align-self: flex-start;
  padding: 10px 0;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  background: var(--color-surface);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
}

/* Something is still to come in. The one outlined tile of the three, because
   it is the only one that is a question rather than a record. */
.tile--risk {
  background: transparent;
  border-color: var(--color-risk);
}

/* She is ahead. Outlined the same way — it is still the open question — but in
   the action hue, because being overpaid costs nothing. */
.tile--action {
  background: transparent;
  border-color: var(--color-action);
}

.owed-figure {
  font-weight: 600;
}

/* Settled: it reads as the other two, because it now is one of them. */
.tile--settled .owed-figure {
  font-weight: 500;
}
</style>
