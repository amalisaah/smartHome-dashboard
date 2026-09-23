<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * The three questions he is asked in a customer's house, in the order he is
 * asked them: how many have you got, what does it cost me, what did it cost us.
 *
 * `Sell` drops its decimals — it is the number he says out loud, and nobody says
 * the pesewas out loud. `Cost` keeps them and sits a shade back, because it is
 * the one figure on this strip that is not the customer's business.
 */
defineProps<{
  stock: string
  sell: string
  cost: string
}>()
</script>

<template>
  <div class="strip">
    <div class="cell">
      <SText type="micro" color="micro">Stock</SText>
      <SText type="list-figure">{{ stock }}</SText>
    </div>
    <div class="cell">
      <SText type="micro" color="micro">Sell</SText>
      <SText type="list-figure">{{ sell }}</SText>
    </div>
    <div class="cell">
      <SText type="micro" color="micro">Cost</SText>
      <SText type="list-figure" color="fg-2">{{ cost }}</SText>
    </div>
  </div>
</template>

<style scoped>
/* The gutters are the background showing through, so the three cells read as one
   instrument rather than as three cards. */
.strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--color-line);
}

.cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 12px;
  background: var(--color-surface);
}
</style>
