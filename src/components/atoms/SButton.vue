<script setup lang="ts">
defineProps<{
  /**
   * `create` is the inline-create chip beside a combobox: mono, action text.
   * `secondary-risk` is the secondary door carrying risk ink — a removal that
   * is reversible, and so must not read as a red destructive button.
   * `chrome` is a button that belongs to a frame rather than to an action bar —
   * a toolbar's secondary, a table row's one-tap action. It rests on
   * `--surface` instead of `--bg` and answers a reach with the action border.
   * `inverse` is the light button on a dark phone header.
   * `link` is a word in a row that undoes something — underlined, no box.
   */
  variant?:
    | 'primary'
    | 'secondary'
    | 'secondary-risk'
    | 'ghost'
    | 'destructive'
    | 'create'
    | 'chrome'
    | 'inverse'
    | 'link'
  /**
   * `sm` / `md` / `lg` are the sans-faced set: an inline action, the laptop door
   * and the phone door.
   *
   * The rest are the display-faced doors the customers module draws, and they
   * carry their label metrics as well as their height — a 36px in-row button and
   * a 52px phone commit are not one size with different padding. `row` is the
   * in-row action, `toolbar` a frame's secondary, `phone-bar` a button in a
   * phone header, `phone-ghost` the quiet phone action, `phone-wide` a
   * full-width phone action and `phone-cta` the one that commits.
   */
  size?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'row'
    | 'toolbar'
    | 'phone-bar'
    | 'phone-ghost'
    | 'phone-wide'
    | 'phone-cta'
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

/* The display-faced doors. The label size moves with the door, so each sets
   both rather than inheriting one and overriding the other. */
.s-btn--row,
.s-btn--toolbar,
.s-btn--phone-bar,
.s-btn--phone-ghost,
.s-btn--phone-wide,
.s-btn--phone-cta {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: normal;
  border-radius: var(--radius-md);
}

/* The one-tap action in a table row: 36px, so a 60px row keeps its own height. */
.s-btn--row {
  min-height: 36px;
  padding: 8px 12px;
  font-size: 13px;
}

/* A frame's secondary. Its height is its padding's, so it stays clear of the
   44px door a primary action owns. */
.s-btn--toolbar {
  padding: 10px 16px;
  font-size: 14px;
}

/* A button in a phone header, beside the screen title. */
.s-btn--phone-bar {
  min-height: 44px;
  padding: 0 14px;
  font-size: 14px;
}

/* The quiet phone action, under the commit. Weight 500: offered, not urged. */
.s-btn--phone-ghost {
  min-height: 44px;
  padding: 0 14px;
  font-size: 15px;
  font-weight: 500;
}

/* A full-width phone action standing on its own. */
.s-btn--phone-wide {
  min-height: 48px;
  padding: 0 16px;
  font-size: 15px;
}

/* The phone's committing action, and the only button on the card radius. */
.s-btn--phone-cta {
  min-height: 52px;
  padding: 0 16px;
  font-size: 16px;
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

/* Archive, and any removal like it. The same box as `secondary` — it is not a
   louder button, it is the ordinary one — with the ink saying what it costs.
   `destructive`'s solid risk fill is for the act that cannot be undone; this is
   for the act that hides a record and keeps every movement under it. The ink
   holds through hover: the warning is what the button is, not a reaction. */
.s-btn--secondary-risk {
  background: var(--color-bg);
  color: var(--color-risk);
  border-color: var(--color-line);
  box-shadow: var(--shadow-elev-1);
}

.s-btn--secondary-risk:hover:not([disabled]) {
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

/* A button that belongs to its frame. `secondary` rests on `--bg` and darkens to
   `--surface`; this starts on `--surface` and answers with the action border
   instead, so a row full of them shows which one the cursor is over. */
.s-btn--chrome {
  background: var(--color-surface);
  color: var(--color-fg);
  border-color: var(--color-line);
}

.s-btn--chrome:hover:not([disabled]) {
  border-color: var(--color-action);
  color: var(--color-action-ink);
}

/* The light button on the dark phone header: the page's ground standing on it. */
.s-btn--inverse {
  background: var(--color-bg);
  color: var(--color-fg);
}

.s-btn--inverse:hover:not([disabled]) {
  background: var(--color-surface);
}

/* The drawn action is lost against `--fg`, so the ring is the lifted one and it
   sits outside the button. */
.s-btn--inverse:focus-visible {
  outline-color: var(--color-action-on-dark);
  outline-offset: 2px;
}

/* A word that undoes something, in the row it undoes. No box: it is the way back
   from the action just taken, not a second one competing with it. Declared after
   the sizes so it keeps its metrics whatever size it is given. */
.s-btn--link {
  background: transparent;
  color: var(--color-fg-2-soft);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: normal;
  padding: 8px 4px;
  min-height: 0;
  border: none;
  border-radius: var(--radius-flag);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.s-btn--link:hover:not([disabled]) {
  color: var(--color-fg);
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
