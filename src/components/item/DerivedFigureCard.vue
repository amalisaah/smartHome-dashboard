<script setup lang="ts">
import { SText } from '@/components/atoms'
import type { DerivedFigure } from '@/types/item'

/**
 * A figure the system decided. Dashed means not-yours-to-type, and these cards
 * are where that is taught — so no hover, no focus, and nothing in the tab order.
 */
defineProps<{ figure: DerivedFigure }>()
</script>

<template>
  <div class="card">
    <SText type="micro" color="micro">{{ figure.label }}</SText>
    <SText type="total">{{ figure.figure }}</SText>
    <!-- A derived figure that cannot say where it came from is a rumour. -->
    <SText type="caption" class="source">{{ figure.source }}</SText>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  background: var(--color-bg);
  border: 1px dashed var(--color-fg-3);
  border-radius: var(--radius-md);
  /* Not an input, and not a disabled one. Nothing to reach for. */
  cursor: default;
}

.source {
  line-height: 1.5;
}
</style>
