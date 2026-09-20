<script setup lang="ts">
defineProps<{
  /** `create` is the inline-create chip beside a combobox: mono, action text. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'create'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  /** The action is in flight. The button is inert while it holds, so it goes once. */
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    class="s-btn"
    :class="[`s-btn--${variant ?? 'primary'}`, `s-btn--${size ?? 'md'}`]"
  >
    <span v-if="loading" class="s-btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.s-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease-out;
  border: 1px solid transparent;
  white-space: nowrap;
  text-wrap: nowrap;
  letter-spacing: 0.01em;
  text-decoration: none;
}

.s-btn:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.s-btn:active:not([disabled]) {
  transform: translateY(1px);
}

/* Sizes */
.s-btn--sm {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: var(--radius-chip);
}

/* Laptop primary action — the >=44px desktop door. */
.s-btn--md {
  min-height: 44px;
  padding: 0 18px;
  font-size: 15px;
  border-radius: var(--radius-md);
}

/* Phone primary action — the >=48px phone door. Compact horizontally so it
   still shares an action bar with the match count at 390px. */
.s-btn--lg {
  min-height: 48px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: var(--radius-md);
}

/* Variants */
.s-btn--primary {
  background: var(--color-action);
  color: var(--color-inverse);
  box-shadow: var(--shadow-elev-1);
}

.s-btn--primary:hover:not([disabled]) {
  background: var(--color-action-hover);
}

.s-btn--secondary {
  background: var(--color-bg);
  color: var(--color-fg);
  border-color: var(--color-line);
  box-shadow: var(--shadow-elev-1);
}

.s-btn--secondary:hover:not([disabled]) {
  background: var(--color-surface);
}

.s-btn--ghost {
  background: transparent;
  color: var(--color-fg-2);
}

.s-btn--ghost:hover:not([disabled]) {
  color: var(--color-fg);
  background: var(--color-surface);
}

/* The create chip beside a combobox. Mono, because what it creates is the query
   the user just typed, quoted back to them. */
.s-btn--create {
  background: var(--color-surface);
  color: var(--color-action);
  border-color: var(--color-line);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: normal;
}

.s-btn--create:hover:not([disabled]) {
  border-color: var(--color-action);
  color: var(--color-action-hover);
}

.s-btn--destructive {
  background: var(--color-risk);
  color: var(--color-inverse);
  box-shadow: var(--shadow-elev-1);
}

.s-btn--destructive:hover:not([disabled]) {
  background: var(--color-risk-hover);
}

/* In flight. It takes the label's ink, so it reads in every variant. */
.s-btn__spinner {
  width: 14px;
  height: 14px;
  flex: none;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--radius-pill);
  animation: s-btn-spin 600ms linear infinite;
}

@keyframes s-btn-spin {
  to {
    transform: rotate(360deg);
  }
}

/* A spin under a reduced-motion setting is the one thing worse than no feedback. */
@media (prefers-reduced-motion: reduce) {
  .s-btn__spinner {
    animation: none;
    border-top-color: currentColor;
    opacity: 0.5;
  }
}

/* In flight is not the same as unavailable: the button keeps its own ink, so the
   spinner reads, and only says it is not taking a second press. */
.s-btn[aria-busy='true'] {
  cursor: progress;
  opacity: 0.8;
}

/* Disabled */
.s-btn[disabled]:not([aria-busy='true']) {
  background: var(--color-surface) !important;
  color: var(--color-disabled-text) !important;
  border-color: transparent !important;
  box-shadow: none !important;
  cursor: not-allowed;
  transform: none !important;
}
</style>
