<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled"
    class="s-btn"
    :class="[`s-btn--${variant ?? 'primary'}`, `s-btn--${size ?? 'md'}`]"
  >
    <slot />
  </button>
</template>

<style scoped>
.s-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.s-btn--md {
  height: 40px;
  padding: 0 18px;
  font-size: 14px;
  border-radius: var(--radius-card);
}

.s-btn--lg {
  height: 48px;
  padding: 0 24px;
  font-size: 15px;
  border-radius: var(--radius-card);
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

.s-btn--destructive {
  background: var(--color-risk);
  color: var(--color-inverse);
  box-shadow: var(--shadow-elev-1);
}

.s-btn--destructive:hover:not([disabled]) {
  background: var(--color-risk-hover);
}

/* Disabled */
.s-btn[disabled] {
  background: var(--color-surface) !important;
  color: var(--color-disabled-text) !important;
  border-color: transparent !important;
  box-shadow: none !important;
  cursor: not-allowed;
  transform: none !important;
}
</style>
