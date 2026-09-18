<script setup lang="ts">
import SText from './SText.vue'

/**
 * A banner states a condition that holds over a whole screen or pane — the
 * catalogue failed to load, a shipment is read-only, prices are a day stale.
 *
 * It is **not** where field validation goes. A problem with one row is said in
 * that row, as its consequence ("blocks receiving"); a banner that summarises
 * errors from elsewhere takes the reader away from the thing they have to fix.
 *
 */
withDefaults(
  defineProps<{
    variant?: 'error' | 'warn' | 'info'
    /** The word that names the severity — "error", "heads up", "note". */
    label?: string
    /** One line saying what is true. The default slot carries the detail. */
    title?: string
    dismissible?: boolean
  }>(),
  { variant: 'info' },
)

defineEmits<{ dismiss: [] }>()
</script>

<template>
  <div
    class="s-banner"
    :class="`s-banner--${variant}`"
    :role="variant === 'error' ? 'alert' : 'status'"
    :aria-live="variant === 'error' ? 'assertive' : 'polite'"
  >
    <div class="s-banner-body">
      <SText v-if="label" type="micro" :color="variant === 'info' ? 'action' : 'risk'">
        {{ label }}
      </SText>
      <SText v-if="title" type="ui">{{ title }}</SText>
      <SText v-if="$slots.default" type="meta"><slot /></SText>
    </div>

    <div v-if="$slots.action" class="s-banner-action">
      <slot name="action" />
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="s-banner-dismiss"
      aria-label="Dismiss"
      @click="$emit('dismiss')"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.s-banner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 16px;
  border: 1px solid var(--color-line);
  border-left-width: 3px;
  border-radius: var(--radius-card);
}

.s-banner-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.s-banner-action {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Error — the loud one: risk accent on a risk-tinted ground. */
.s-banner--error {
  background: var(--color-row-risk-tint);
  border-left-color: var(--color-risk);
}

/* Warn — the same risk accent, held back to the page ground. */
.s-banner--warn {
  background: var(--color-bg);
  border-left-color: var(--color-risk);
}

.s-banner--info {
  background: var(--color-row-action-tint);
  border-left-color: var(--color-action);
}

/* The drawn box is 24px; the tap target is stretched to the phone door. */
.s-banner-dismiss {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-chip);
  color: var(--color-fg-2);
  cursor: pointer;
  transition: background-color 120ms ease-out, color 120ms ease-out;
}

.s-banner-dismiss::after {
  content: '';
  position: absolute;
  inset: 50% auto auto 50%;
  width: var(--hit-min, 48px);
  height: var(--hit-min, 48px);
  transform: translate(-50%, -50%);
}

.s-banner-dismiss:hover {
  color: var(--color-fg);
}

.s-banner--error .s-banner-dismiss:hover,
.s-banner--warn .s-banner-dismiss:hover {
  background: var(--color-row-hover-risk);
}

.s-banner--info .s-banner-dismiss:hover {
  background: var(--color-row-hover-action);
}

.s-banner-dismiss:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}
</style>
