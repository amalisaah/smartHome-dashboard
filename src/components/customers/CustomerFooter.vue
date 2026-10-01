<script setup lang="ts">
import { SText } from '@/components/atoms'
import { DORMANCY_EXPLAINER } from '@/data/customersMock'

defineProps<{ summary: string }>()
</script>

<template>
  <div class="footer">
    <SText type="cell-meta" color="fg-2-soft" role="status" aria-live="polite">
      {{ summary }}
    </SText>
    <!-- 60 days as a sentence; nothing computes with it. -->
    <SText type="cell-meta" color="fg-2-soft">{{ DORMANCY_EXPLAINER }}</SText>
  </div>
</template>

<style scoped>
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
}
</style>
