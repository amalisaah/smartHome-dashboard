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
  /** `row` is the in-row flag chip: lowercase, untracked, tighter box. */
  size?: 'default' | 'row'
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
