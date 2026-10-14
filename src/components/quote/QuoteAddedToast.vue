<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * What just landed, and where.
 *
 * It names the room because the picker covers the list: he cannot see the line
 * appear, so the toast is the only confirmation that the tap went where he meant
 * it to. It sits above the money bar rather than over it, since the figure it
 * just changed is the thing he looks at next.
 *
 * `role="status"` rather than `alert`: it is confirmation, not interruption.
 */
defineProps<{ text: string }>()
</script>

<template>
  <div class="toast" role="status" aria-live="polite">
    <SText type="cell" class="label">Added {{ text }}</SText>
  </div>
</template>

<style scoped>
.toast {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 100px;
  padding: 12px 14px;
  background: var(--color-fg);
  border-radius: var(--radius-card);
  z-index: 3;
}

.label {
  color: var(--color-bg);
}
</style>
