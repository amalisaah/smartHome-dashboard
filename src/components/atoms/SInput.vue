<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  prefix?: string
  /** A unit that belongs to the value, sitting after it — `%`. */
  suffix?: string
  derived?: boolean
  error?: boolean
  errorMessage?: string
  caption?: string
  type?: string
  required?: boolean
  disabled?: boolean
  /**
   * `on-dark` is the field that sits on the dark app bar / phone header.
   * `flat` is a field inside a table row: it draws no box until you reach for
   * it, so the table reads as figures rather than as a form. `accent` carries
   * the action border at rest — a field whose value is a decision he made.
   */
  variant?: 'default' | 'on-dark' | 'flat' | 'accent'
  /**
   * `md` / `lg` are the laptop and phone doors. `field` is the shipment meta
   * strip; `row` and `row-figure` are the two in-table fields (a label and the
   * figure beside it); `split` is the 92px override input. `cell` is a table
   * cell's own words made editable — the metrics of `SText type="cell"`, so a
   * row holding one keeps the height it had as text.
   */
  size?: 'md' | 'lg' | 'field' | 'row' | 'row-figure' | 'split' | 'cell'
  /** Every figure is mono and tabular — these tables are read by column. */
  mono?: boolean
  align?: 'left' | 'right'
  /**
   * A blank row that is not a row yet. It keeps its dashes until it holds a
   * value, then becomes solid: dashed means not-yet, solid means real.
   */
  dashed?: boolean
  /** Use when the field has no visible label. */
  ariaLabel?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const showDashes = computed(() => props.dashed === true && !props.modelValue)

/** The visible label has to name the field to the screen reader too. */
const fieldId = useId()

/** So a screen can put the caret where the flow says it belongs. */
const inputEl = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<template>
  <div class="s-input-group">
    <label
      v-if="label"
      :for="fieldId"
      class="s-input-label"
      :class="{ 's-input-label--error': error }"
    >
      {{ label }}<span v-if="required" class="s-input-required"> *</span>
    </label>
    <div
      class="s-input-wrap"
      :class="[
        `s-input-wrap--${variant ?? 'default'}`,
        `s-input-wrap--size-${size ?? 'md'}`,
        {
          's-input-wrap--error': error,
          's-input-wrap--derived': derived,
          's-input-wrap--dashed': showDashes,
          's-input-wrap--has-prefix': prefix,
        },
      ]"
    >
      <span v-if="prefix" class="s-input-prefix">{{ prefix }}</span>
      <input
        ref="inputEl"
        :id="fieldId"
        :value="modelValue"
        :type="type ?? 'text'"
        :placeholder="placeholder"
        :disabled="disabled || derived"
        :readonly="derived"
        :aria-label="ariaLabel"
        class="s-input"
        :class="[
          `s-input--${size ?? 'md'}`,
          {
            's-input--derived': derived,
            's-input--mono': mono,
            's-input--right': align === 'right',
          },
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="suffix" class="s-input-suffix">{{ suffix }}</span>
    </div>
    <span v-if="error && errorMessage" class="s-input-hint s-input-hint--error">{{ errorMessage }}</span>
    <span v-else-if="caption" class="s-input-hint">{{ caption }}</span>
  </div>
</template>

<style scoped>
.s-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.s-input-label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-fg-2);
  letter-spacing: 0.01em;
}

.s-input-label--error {
  color: var(--color-risk);
}

.s-input-required {
  color: var(--color-risk);
}

.s-input-wrap {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg);
  transition: border-color 120ms ease-out, background-color 120ms ease-out;
}

/* Reaching for a field firms up its border before you are in it. */
.s-input-wrap:hover:not(:focus-within):not(.s-input-wrap--derived):not(.s-input-wrap--error):not(.s-input-wrap--accent) {
  border-color: var(--color-fg-3);
}

.s-input-wrap--accent:hover:not(:focus-within) {
  border-color: var(--color-action-hover);
}

.s-input-wrap:focus-within {
  border-color: var(--color-action);
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.s-input-wrap--error {
  border-color: var(--color-risk);
}

/* Risk-state fields focus with --risk instead of --action. */
.s-input-wrap--error:focus-within {
  border-color: var(--color-risk);
  outline-color: var(--color-risk);
}

/* A field sitting on the dark app bar / phone header. */
.s-input-wrap--on-dark {
  background: var(--color-field-dark);
  border-color: var(--color-field-dark-line);
}

.s-input-wrap--on-dark .s-input {
  color: var(--color-inverse);
}

.s-input-wrap--on-dark .s-input::placeholder {
  color: var(--color-muted-dark);
}

.s-input-wrap--derived {
  border-style: dashed;
  border-color: var(--color-fg-3);
  background: var(--color-surface);
}

.s-input-wrap--derived:focus-within {
  border-color: var(--color-fg-3);
  box-shadow: none;
}

/* A value he decided rather than one he was given. */
.s-input-wrap--accent {
  border-color: var(--color-action);
}

/* Not yet a row. The dashes go the moment it holds a value. */
.s-input-wrap--dashed {
  border-style: dashed;
  border-color: var(--color-fg-3);
}

/* In a table row: no box at rest, the box on hover, the focus ring on focus.
   The border is always drawn, transparent, so nothing shifts when it colours;
   the negative margin puts the value back where the column expects it. */
.s-input-wrap--flat {
  border-color: transparent;
  border-radius: var(--radius-chip);
  background: transparent;
  overflow: visible;
  margin: -3px -7px;
}

.s-input-wrap--flat:hover:not(:focus-within) {
  border-color: var(--color-fg-3);
}

.s-input-prefix,
.s-input-suffix {
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: var(--color-surface);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-fg-2);
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;
}

/* The prefix is a fact about the field — `1 USD =`, `GH₵` — so it is fenced off
   from the value. The suffix is part of the value's reading, so it is not. */
.s-input-prefix {
  border-right: 1px solid var(--color-line);
}

.s-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-sans);
  color: var(--color-fg);
  min-width: 0;
}

.s-input--md {
  padding: 10px 12px;
  font-size: 14px;
}

.s-input--lg {
  padding: 12px;
  font-size: 15px;
  min-height: 48px;
}

/* The shipment meta strip. */
.s-input--field {
  padding: 11px 12px;
  font-size: 14px;
}

.s-input-wrap--size-field .s-input-prefix,
.s-input-wrap--size-field .s-input-suffix {
  font-size: 12px;
  padding: 0 10px;
  color: var(--color-micro);
}

/* The two in-table fields: a cost's label, and the figure beside it. */
.s-input--row {
  padding: 9px 10px;
  font-size: 14px;
}

.s-input--row-figure {
  padding: 9px 10px;
  font-size: 13px;
}

/* The 92px override split input. */
.s-input-wrap--size-split {
  border-radius: var(--radius-chip);
}

.s-input--split {
  padding: 7px 8px;
  font-size: 13px;
}

.s-input-wrap--size-split .s-input-suffix {
  font-size: 12px;
  padding: 0 8px;
  color: var(--color-micro);
}

/* A figure sitting in a table row, borderless until reached for. */
.s-input-wrap--flat .s-input {
  padding: 2px 6px;
  font-size: 13px;
}

/* A cell's words, not its figure: 14px, the size the column reads at. Flat sets
   the metrics of a figure, so a size passed alongside it has to win. */
.s-input-wrap--flat .s-input--cell,
.s-input--cell {
  padding: 6px 8px;
  font-size: 14px;
}

/* `flat` pulls the value back to where plain text sat, so the offset follows
   the padding: 1px of border plus the padding above and to the left. */
.s-input-wrap--flat.s-input-wrap--size-cell {
  margin: -7px -9px;
}

.s-input::placeholder {
  color: var(--color-fg-3);
}

.s-input--mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.s-input--right {
  text-align: right;
}

.s-input--derived {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-fg-2);
  cursor: not-allowed;
}

.s-input-hint {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--color-fg-3);
}

.s-input-hint--error {
  color: var(--color-risk);
}
</style>
