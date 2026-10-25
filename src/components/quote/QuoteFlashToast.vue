<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * What just happened to a quote, said on the screen he lands on.
 *
 * `Mark sent` is the one press on this module with nothing to show for itself:
 * the quote looks the same, because the app did not send anything — he did, on
 * WhatsApp. So the confirmation is the row having moved, and this names the
 * move while he is looking at where it moved to.
 *
 * `role="status"`, not `alert`: it is confirmation, not interruption, and there
 * is nothing to do about it.
 */
defineProps<{ text: string }>()
</script>

<template>
  <div class="toast" role="status" aria-live="polite">
    <SText type="cell" class="label">{{ text }}</SText>
  </div>
</template>

<style scoped>
/* Fixed rather than absolute: it belongs to the screen, not to whichever
   column of the list happens to be under it. */
.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
  padding: 12px 16px;
  background: var(--color-fg);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-2);
  z-index: 60;
  animation: toast-in 200ms ease-out;
}

.label {
  color: var(--color-bg);
}

@keyframes toast-in {
  from {
    transform: translate(-50%, 8px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    animation: none;
  }
}
</style>
