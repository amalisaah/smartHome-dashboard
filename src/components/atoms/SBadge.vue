<script setup lang="ts">
defineProps<{
  variant?:
    | 'category-dark'
    | 'category-mid'
    | 'category-outlined'
    | 'derived'
    | 'overridden'
    | 'low-stock'
    | 'incomplete'
    | 'accepted'
    | 'archived'
    | 'source-to-order'
    | 'nav-risk'
    | 'draft'
    | 'received'
    | 'neutral'
    | 'missing'
  /**
   * `row` is the in-row flag chip: lowercase, untracked, tighter box.
   * `state` is the sentence-shaped chip — `draft · arrives 24 Sep` — at 11px.
   */
  size?: 'default' | 'row' | 'state'
}>()
</script>

<template>
  <span class="s-badge" :class="[`s-badge--${variant ?? 'category-mid'}`, `s-badge--size-${size ?? 'default'}`]">
    <slot />
  </span>
</template>

<style scoped>
.s-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: var(--radius-chip);
  border: 1px solid transparent;
  white-space: nowrap;
  line-height: 1.2;
}

/* Flag chip sitting inside a table row: states the problem in words, so it
   keeps sentence spacing rather than the tracked-uppercase category look. */
.s-badge--size-row {
  padding: 3px 6px;
  border-radius: var(--radius-flag);
  letter-spacing: normal;
  text-transform: none;
}

/* A chip that says a state in words rather than labelling a category, so it
   reads at sentence scale: `draft · affects nothing yet`, `received 12 Aug`. */
.s-badge--size-state {
  font-size: 11px;
  padding: 5px 9px;
  letter-spacing: normal;
  text-transform: none;
  /* Sentence leading, not the tracked-label kind: these chips sit inline with
     13px prose and have to share its baseline rhythm. */
  line-height: normal;
}

/* Dashed means not-yet: nothing here has happened to stock or costs. */
.s-badge--draft {
  background: transparent;
  color: var(--color-fg-2);
  border: 1px dashed var(--color-fg-3);
}

/* `draft` in risk ink: a blank that is holding something up — `no group`. Dashed
   because it is not-yet rather than not-yours, and risk because the blank costs
   something. It completes the chip vocabulary's one open corner: `draft` is the
   quiet not-yet, `incomplete` the solid-bordered problem, this the loud not-yet. */
.s-badge--missing {
  background: transparent;
  color: var(--color-risk);
  border: 1px dashed var(--color-risk);
}

/* A chip that reports a count rather than labelling a category, so it reads at
   full ink: `3 costs down`. */
.s-badge--neutral {
  background: var(--color-surface);
  color: var(--color-fg);
  border-color: var(--color-line);
}

/* Solid fill, no border — the committed counterpart to `draft`. */
.s-badge--received {
  background: var(--color-line);
  color: var(--color-fg);
  /* A fill, not an outline: it carries no border at all, which is what makes it
     read as the solid counterpart to the dashed draft chip. */
  border: none;
}

.s-badge--category-dark {
  background: var(--color-fg);
  color: var(--color-inverse);
}

.s-badge--category-mid {
  background: var(--color-surface);
  color: var(--color-fg-2);
  border-color: var(--color-line);
}

.s-badge--category-outlined {
  background: transparent;
  color: var(--color-fg-2);
  border-color: var(--color-line);
}

.s-badge--derived {
  background: transparent;
  color: var(--color-fg-3);
  border: 1px dashed var(--color-fg-3);
}

.s-badge--overridden {
  background: transparent;
  color: var(--color-action);
  border-color: var(--color-action);
}

.s-badge--low-stock {
  background: var(--color-risk);
  color: var(--color-inverse);
}

.s-badge--incomplete {
  background: transparent;
  color: var(--color-risk);
  border-color: var(--color-risk);
}

.s-badge--accepted {
  background: var(--color-action);
  color: var(--color-inverse);
}

/* A filled chip inside a table row reserves no border space and takes sentence
   leading, so it sits in the row without making it taller than its text does.
   Deliberately not extended to `low-stock`, which would restate the catalogue's
   finished row height for the sake of a pixel. */
.s-badge--accepted.s-badge--size-row {
  border: none;
  line-height: normal;
}

.s-badge--archived {
  background: var(--color-surface);
  color: var(--color-fg-3);
  text-decoration: line-through;
  border-color: var(--color-line);
}

.s-badge--source-to-order {
  background: var(--color-line);
  color: var(--color-fg);
}

.s-badge--nav-risk {
  background: var(--color-risk);
  color: var(--color-inverse);
  border-radius: var(--radius-pill);
  padding: 2px 7px;
  font-size: 10px;
}
</style>
