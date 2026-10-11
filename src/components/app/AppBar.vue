<script setup lang="ts">
import { SText } from '@/components/atoms'

defineProps<{
  status: string
  /**
   * The status is reporting something wrong — no connection, or a write that
   * did not land. It takes risk ink; nothing else on the screen changes.
   */
  alarmed?: boolean
}>()
</script>

<template>
  <div class="app-bar">
    <SText type="app-title" color="inverse">Smart Home Ops</SText>
    <SText
      type="cell-meta"
      :color="alarmed ? 'risk' : 'muted-dark'"
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
