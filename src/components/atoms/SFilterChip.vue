<script setup lang="ts">
defineProps<{
  /**
   * `risk-filled` is the loud chip (low stock), `risk-outlined` the quiet one
   * (needs attention). The emphasis is fixed per chip — it marks severity, not
   * selection; selection is the ring.
   */
  variant?: 'risk-filled' | 'risk-outlined' | 'neutral-outlined'
  size?: 'md' | 'phone'
  selected?: boolean
}>()
</script>

<template>
  <button
    type="button"
    class="s-chip"
    :class="[`s-chip--${variant ?? 'risk-outlined'}`, `s-chip--${size ?? 'md'}`, { 's-chip--selected': selected }]"
    :aria-pressed="selected ?? false"
  >
    <slot />
  </button>
</template>

<style scoped>
.s-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  line-height: normal;
  border-radius: var(--radius-chip);
  border: 1px solid transparent;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 120ms ease-out, color 120ms ease-out, box-shadow 120ms ease-out;
}

.s-chip--md {
  padding: 8px 11px;
}

/* Phone door: the drawn box stays at the reference metrics, the tap target
   is stretched to 48px with a transparent overlay. */
.s-chip--phone {
  padding: 9px 11px;
  position: relative;
}

.s-chip--phone::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min, 48px);
  transform: translateY(-50%);
}

.s-chip--risk-filled {
  background: var(--color-risk);
  color: var(--color-bg);
}

.s-chip--risk-filled:hover {
  background: var(--color-risk-hover);
}

.s-chip--risk-outlined {
  background: transparent;
  border-color: var(--color-risk);
  color: var(--color-risk);
}

.s-chip--risk-outlined:hover {
  background: var(--color-row-risk-tint);
}

.s-chip--neutral-outlined {
  background: transparent;
  border-color: var(--color-line);
  color: var(--color-fg-2);
}

.s-chip--neutral-outlined:hover {
  background: var(--color-surface);
}

/* Selected — a ring held off the chip by the page ground, so it reads the same
   whether the chip underneath is filled or outlined. */
.s-chip--selected {
  box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 3px var(--color-risk);
}

.s-chip--neutral-outlined.s-chip--selected {
  box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 3px var(--color-action);
}

.s-chip:focus-visible {
  outline: 2px solid var(--color-risk);
  outline-offset: -1px;
}

.s-chip--neutral-outlined:focus-visible {
  outline-color: var(--color-action);
}
</style>
