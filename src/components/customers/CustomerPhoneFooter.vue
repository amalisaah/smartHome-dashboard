<script setup lang="ts">
import { SText } from '@/components/atoms'

defineProps<{ summary: string }>()
</script>

<template>
  <div class="footer">
    <SText type="cell-meta" color="fg-2-soft" role="status" aria-live="polite">
      {{ summary }}
    </SText>
  </div>
</template>

<style scoped>
.footer {
  padding: 12px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  /* Holds the match count, so it stays visible while the list scrolls. */
  position: sticky;
  bottom: 0;
  z-index: 2;
}
</style>
