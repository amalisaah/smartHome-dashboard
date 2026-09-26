<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * The three questions he is asked in a customer's house, in that order. `Sell`
 * drops its decimals — nobody says pesewas out loud. `Cost` sits a shade back:
 * the one figure here that is not the customer's business.
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
/* The gutters are the background showing through, so the three read as one
   instrument rather than three cards. */
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
