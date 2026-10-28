<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import type { JobMoney } from '@/types/job'
import { formatCurrency, formatMoneyWhole } from '@/utils/format'

const props = defineProps<{ money: JobMoney }>()

/**
 * `vs quote: expected 3,405 at the agreed price · +438`.
 *
 * Both figures come off `/summary` whole — `expected_profit` is the quote's
 * own, read back rather than recomputed, so this card compares against the
 * figure he was actually looking at when he set the price.
 *
 * Null on a job with no quote behind it, and then the line is not drawn:
 * there is nothing to have expected, and `±0` would read as a job that came in
 * exactly as planned.
 */
const variance = computed(() => {
  const { expectedProfitPesewas, profitVariancePesewas } = props.money
  if (expectedProfitPesewas === null || profitVariancePesewas === null) return null

  const sign = profitVariancePesewas >= 0 ? '+' : '−'
  const size = formatMoneyWhole(Math.abs(profitVariancePesewas))
  return `vs quote: expected ${formatMoneyWhole(expectedProfitPesewas)} at the agreed price · ${sign}${size}`
})
</script>

<template>
  <section class="card">
    <SText type="micro" color="muted-dark" class="label">Profit on this job · owner only</SText>

    <!-- The only dark card on the screen, and the only figure at this size: it
         is the one number the evening is actually about. A loss is a real
         answer and is drawn the same way — the minus is the whole report. -->
    <SText type="money-lg" color="inverse">{{ formatCurrency(money.profitPesewas) }}</SText>

    <SText type="meta" color="muted-dark">
      Charged {{ formatMoneyWhole(money.chargedPesewas) }} − cost
      {{ formatMoneyWhole(money.costTotalPesewas) }} (devices
      {{ formatMoneyWhole(money.deviceCostPesewas) }} + misc
      {{ formatMoneyWhole(money.miscActualPesewas) }})
    </SText>

    <SText v-if="variance" type="cell-meta" color="muted-dark" class="variance">
      {{ variance }}
    </SText>
  </section>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  background: var(--color-fg);
  border-radius: var(--radius-card);
}

/* The micro role tracks at .14em; this label is drawn a touch wider. */
.label {
  letter-spacing: 0.12em;
}

.variance {
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid var(--color-fg-2);
}
</style>
