<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?:
    | 'display'
    | 'title'
    | 'heading'
    | 'screen-title'
    | 'app-title'
    | 'body'
    | 'list-title'
    | 'ui'
    | 'meta'
    | 'tab'
    | 'label'
    | 'caption'
    | 'micro'
    | 'column-header'
    | 'money-lg'
    | 'figure'
    | 'list-figure'
    | 'money'
    | 'list-meta'
    | 'cell-meta'
  color?: 'fg' | 'fg-2' | 'fg-2-soft' | 'micro' | 'fg-3' | 'action' | 'risk' | 'inverse' | 'muted-dark'
  as?: string
}>()

const BLOCK_TYPES = new Set([
  'display',
  'title',
  'heading',
  'screen-title',
  'body',
  'list-title',
  'meta',
  'label',
  'caption',
])

const tag = computed(() => props.as ?? (BLOCK_TYPES.has(props.type ?? 'body') ? 'p' : 'span'))
</script>

<template>
  <component
    :is="tag"
    class="s-text"
    :class="[`s-text--${type ?? 'body'}`, color && `s-text--color-${color}`]"
  >
    <slot />
  </component>
</template>

<style scoped>
.s-text {
  margin: 0;
}

/* === Type roles === */
.s-text--display {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--color-fg);
}

.s-text--title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-fg);
}

.s-text--heading {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-fg);
}

/* Phone screen title — the one display role below 18px, per the A2 frame. */
.s-text--screen-title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--color-fg);
}

/* App-bar wordmark. */
.s-text--app-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-fg);
}

.s-text--body {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-fg);
}

/* Name line of a phone list row. */
.s-text--list-title {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-fg);
}

.s-text--ui {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-fg);
}

.s-text--meta {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-fg-2);
}

/* Tab-bar label. Active tabs carry weight 600 from the tab bar itself. */
.s-text--tab {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-fg-2-soft);
}

.s-text--label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--color-fg-2);
}

/* Caption under a summary figure. */
.s-text--caption {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 400;
  color: var(--color-fg-2-soft);
}

.s-text--micro {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-fg-2);
}

/* Table column header — micro at tighter tracking. */
.s-text--column-header {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-fg-2-soft);
}

.s-text--money-lg {
  font-family: var(--font-mono);
  font-size: 30px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  color: var(--color-fg);
}

/* Summary-strip figure. */
.s-text--figure {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--color-fg);
}

/* Selling price on a phone list row. */
.s-text--list-figure {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--color-fg);
}

.s-text--money {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--color-fg);
}

/* Meta line of a phone list row. */
.s-text--list-meta {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--color-fg-2-soft);
}

/* Quiet mono at row scale — Group and Lead cells, footers, app-bar status. */
.s-text--cell-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--color-fg-2-soft);
}

/* === Color overrides === */
.s-text--color-fg          { color: var(--color-fg); }
.s-text--color-fg-2        { color: var(--color-fg-2); }
.s-text--color-fg-2-soft   { color: var(--color-fg-2-soft); }
.s-text--color-micro       { color: var(--color-micro); }
.s-text--color-fg-3        { color: var(--color-fg-3); }
.s-text--color-action      { color: var(--color-action); }
.s-text--color-risk        { color: var(--color-risk); }
.s-text--color-inverse     { color: var(--color-inverse); }
.s-text--color-muted-dark  { color: var(--color-muted-dark); }
</style>
