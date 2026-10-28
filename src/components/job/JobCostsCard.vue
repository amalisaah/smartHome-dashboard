<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SText } from '@/components/atoms'
import type { JobCostRow } from '@/types/job'
import { formatMoney, formatMoneyWhole } from '@/utils/format'

const props = defineProps<{
  costs: JobCostRow[]
  actualPesewas: number
  estimatePesewas: number
  /** Actual minus the estimate, straight off `/summary`. */
  deltaPesewas: number
}>()

/** `395 vs 300 estimated · +95`. The delta is supplied; the sign is drawn. */
const against = computed(() => {
  const sign = props.deltaPesewas >= 0 ? '+' : '−'
  return `${formatMoneyWhole(props.actualPesewas)} vs ${formatMoneyWhole(props.estimatePesewas)} estimated · ${sign}${formatMoneyWhole(Math.abs(props.deltaPesewas))}`
})

const costStub = ref(false)
</script>

<template>
  <section class="card">
    <div class="head">
      <SText type="heading" as="h2">Costs</SText>
      <!-- Amber whichever way it went: the point of the line is that the
           estimate and the actual are different numbers, and he is the only
           person who ever sees either. -->
      <SText type="cell-meta" color="risk">{{ against }}</SText>
    </div>

    <div class="rows">
      <div v-for="cost in costs" :key="cost.id" class="row">
        <span class="label">
          <SText type="cell">{{ cost.label }}</SText>
          <span v-if="cost.hasReceipt" class="tag tag--receipt">receipt</span>
        </span>
        <!-- Solid for `field`, dashed for `desk`: the same not-yet/committed
             rule the rest of the system draws, here saying which figure was
             written while he was standing in front of the thing it paid for. -->
        <span class="tag tag--source" :class="{ 'tag--desk': cost.source === 'desk' }">
          {{ cost.source }}
        </span>
        <SText type="money" class="amount">{{ formatMoney(cost.amountPesewas) }}</SText>
      </div>

      <!-- Kept on a completed job: a receipt surfacing a week later is normal,
           and it moves no stock and no house record. -->
      <SButton variant="link" size="sm" class="add" @click="costStub = true">+ Add a cost</SButton>
      <SText v-if="costStub" type="hint">
        adding a cost by hand is not drawn yet — the field path is the phone's quick-cost
      </SText>
    </div>

    <SText type="caption">
      "field" = thrown at the job from his phone on the day. "desk" = added afterwards. A field
      figure is the one to trust.
    </SText>
  </section>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.rows {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-divider);
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid var(--color-divider);
}

.label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* Smaller than any SBadge size: these two are annotations on a row rather than
   chips stating a state, and at chip scale they would outweigh the cost they
   annotate. */
.tag {
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: normal;
  padding: 2px 6px;
  border-radius: var(--radius-flag);
  color: var(--color-fg-2);
  white-space: nowrap;
}

.tag--receipt {
  background: var(--color-surface);
}

.tag--source {
  border: 1px solid var(--color-fg-3);
}

.tag--desk {
  border-style: dashed;
}

.amount {
  width: 64px;
  text-align: right;
}

.add {
  align-self: flex-start;
  padding: 10px 0;
}
</style>
