<script setup lang="ts">
defineProps<{
  /**
   * `risk-filled` is the loud chip (low stock), `risk-outlined` the quiet one
   * (needs attention). The emphasis is fixed per chip — it marks severity, not
   * selection; selection is the ring.
   *
   * `choice` is the exception because it is a different control: a
   * *single-select* set, not independent toggles. Exactly one is always chosen,
   * so the fill can say which, and a ring on a chip that cannot be unchosen says
   * nothing. It carries no severity, hence the neutral inks.
   */
  variant?: 'risk-filled' | 'risk-outlined' | 'neutral-outlined' | 'choice'
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

/* One point larger than the toggles: it labels the whole list rather than
   flagging a condition in it. */
.s-chip--choice {
  font-size: 12px;
  background: var(--color-bg);
  border-color: var(--color-line);
  color: var(--color-fg-2);
}

.s-chip--choice:hover:not(.s-chip--selected) {
  border-color: var(--color-fg-3);
}

/* The fill is the selection here, so no ring — see the variant note. */
.s-chip--choice.s-chip--selected {
  background: var(--color-fg);
  border-color: var(--color-fg);
  color: var(--color-bg);
  box-shadow: none;
}

/* The drawn box is 40px; the 48px target comes from the ::after overlay, so the
   chips stay 8px apart instead of being forced to a 48px rhythm. */
.s-chip--choice.s-chip--phone {
  padding: 0 12px;
  min-height: 40px;
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

.s-chip--neutral-outlined:focus-visible,
.s-chip--choice:focus-visible {
  outline-color: var(--color-action);
}

/* A filled chip is `--fg`, so an inset ring would be lost in it. */
.s-chip--choice.s-chip--selected:focus-visible {
  outline-offset: 2px;
}
</style>
