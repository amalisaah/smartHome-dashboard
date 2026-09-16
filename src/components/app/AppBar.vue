<script setup lang="ts">
import { SText } from '@/components/atoms'

defineProps<{
  status: string
  /** Offline swaps the status text to risk. Nothing else on the screen changes. */
  offline?: boolean
}>()
</script>

<template>
  <div class="app-bar">
    <SText type="app-title" color="inverse">Smart Home Ops</SText>
    <SText
      type="cell-meta"
      :color="offline ? 'risk' : 'muted-dark'"
      role="status"
      aria-live="polite"
    >
      {{ status }}
    </SText>
  </div>
</template>

<style scoped>
.app-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--color-fg);
}
</style>
