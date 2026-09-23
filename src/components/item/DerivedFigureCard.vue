<script setup lang="ts">
import { SText } from '@/components/atoms'
import type { DerivedFigure } from '@/types/item'

/**
 * A figure the system decided. The dashed border is the system-wide rule —
 * **dashed means not-yours-to-type** — and these three cards are where it is
 * taught, so they must not read as fields: no hover, no focus, no cursor
 * change, and nothing in the tab order.
 */
defineProps<{ figure: DerivedFigure }>()
</script>

<template>
  <div class="card">
    <SText type="micro" color="micro">{{ figure.label }}</SText>
    <SText type="total">{{ figure.figure }}</SText>
    <!-- Where it came from. A derived figure that cannot say why is a rumour. -->
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
  /* Not an input, not a disabled input. Nothing to reach for. */
  cursor: default;
}

.source {
  line-height: 1.5;
}
</style>
