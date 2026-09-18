<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?:
    | 'display'
    | 'sheet-title'
    | 'title'
    | 'frame-title'
    | 'dialog-title'
    | 'heading'
    | 'screen-title'
    | 'pane-title'
    | 'app-title'
    | 'body'
    | 'list-title'
    | 'ui'
    | 'cell'
    | 'meta'
    | 'row-meta'
    | 'tab'
    | 'label'
    | 'caption'
    | 'micro'
    | 'hint'
    | 'column-header'
    | 'money-lg'
    | 'figure'
    | 'total'
    | 'list-figure'
    | 'cell-prompt'
    | 'count'
    | 'ref'
    | 'money'
    | 'list-meta'
    | 'cell-meta'
  color?: 'fg' | 'fg-2' | 'fg-2-soft' | 'micro' | 'fg-3' | 'action' | 'risk' | 'inverse' | 'muted-dark'
  as?: string
}>()

const BLOCK_TYPES = new Set([
  'display',
  'sheet-title',
  'title',
  'frame-title',
  'dialog-title',
  'heading',
  'screen-title',
  'pane-title',
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

/* Title of a surface that opens over a frame — C2's "What the freight did…".
   Sits between `display` and `title`; the reference tracks it in a touch. */
.s-text--sheet-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  line-height: normal;
  letter-spacing: -0.01em;
  color: var(--color-fg);
}

.s-text--title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-fg);
}

/* The name of a whole frame, in its header bar — "Shipment SH-015", "Shipments". */
.s-text--frame-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  line-height: normal;
  color: var(--color-fg);
}

/* Title of a modal dialog — "Receive SH-015?". */
.s-text--dialog-title {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  line-height: normal;
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

/* Header of one pane inside a frame — "Invoice lines", "Shared costs". */
.s-text--pane-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  line-height: normal;
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

/* Text in a laptop table row — an item name, a supplier. `ui` is the same size
   carrying weight; this is the unweighted one, and it takes its line-height from
   the row so a table keeps the height the frame draws. */
.s-text--cell {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 400;
  color: var(--color-fg);
}

.s-text--meta {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-fg-2);
}

/* `meta` at the same size without the leading: a label in a panel row or an
   action bar, where the line box must not push the row taller than its box. */
.s-text--row-meta {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 400;
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

/* Mono micro that reads as a sentence, not a label: a pane caption
   ("prices as invoiced, in USD"), a field's own hint ("no match in 214 items").
   Same size as `micro`, without the uppercase and the tracking. */
.s-text--hint {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  color: var(--color-micro);
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

/* The one figure a block is about — a shipment total. */
.s-text--total {
  font-family: var(--font-mono);
  font-size: 22px;
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

/* Where a figure should be, a control instead — C2's "pick a group". The cell
   text is the control, so it reads at figure weight rather than as prose. */
.s-text--cell-prompt {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-fg);
}

/* A figure standing inside a line of prose — the `+70` a consequence opens
   with. Mono, so a stack of them lines up down the left. */
.s-text--count {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--color-fg);
}

/* A document number — a shipment ref. Mono, because it is read by column. */
.s-text--ref {
  font-family: var(--font-mono);
  font-size: 13px;
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
