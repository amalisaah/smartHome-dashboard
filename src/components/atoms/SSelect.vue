<script setup lang="ts" generic="T extends string | number">
import { useId } from 'vue'

defineProps<{
  modelValue?: T
  label?: string
  options: { label: string; value: T }[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  required?: boolean
  /** `chip` matches the filter-chip metrics — used on the phone filter row. */
  variant?: 'default' | 'chip'
  /** `field` is the shipment meta strip's door, one step taller than `md`. */
  size?: 'md' | 'field'
  /** Use when the control has no visible label. */
  ariaLabel?: string
}>()

defineEmits<{
  'update:modelValue': [value: T]
}>()

/** The visible label has to name the control to the screen reader too. */
const fieldId = useId()
</script>

<template>
  <div class="s-select-group">
    <label
      v-if="label"
      :for="fieldId"
      class="s-select-label"
      :class="{ 's-select-label--error': error }"
    >
      {{ label }}<span v-if="required" class="s-select-required"> *</span>
    </label>
    <div
      class="s-select-wrap"
      :class="[
        `s-select-wrap--${variant ?? 'default'}`,
        { 's-select-wrap--error': error, 's-select-wrap--disabled': disabled },
      ]"
    >
      <select
        :id="fieldId"
        :value="modelValue"
        :disabled="disabled"
        :aria-label="ariaLabel"
        class="s-select"
        :class="`s-select--${size ?? 'md'}`"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value as T)"
      >
        <option v-if="placeholder" value="" disabled :selected="modelValue === undefined || modelValue === ''">
          {{ placeholder }}
        </option>
        <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <span v-if="variant === 'chip'" class="s-select-caret" aria-hidden="true">▾</span>
      <svg v-else class="s-select-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3 5L7 9L11 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <span v-if="error && errorMessage" class="s-cbx-hint s-cbx-hint--error">{{ errorMessage }}</span>
  </div>
</template>

<style scoped>
.s-select-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.s-select-label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-fg-2);
  letter-spacing: 0.01em;
}

.s-select-label--error {
  color: var(--color-risk);
}

.s-select-required {
  color: var(--color-risk);
}

.s-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  transition: border-color 120ms ease-out, background-color 120ms ease-out;
}

.s-select-wrap:hover:not(.s-select-wrap--disabled) {
  background: var(--color-surface);
}

/* Reaching for the control firms up its border, as on every other field. */
.s-select-wrap:hover:not(.s-select-wrap--disabled):not(:focus-within):not(.s-select-wrap--error) {
  border-color: var(--color-fg-3);
}

.s-select-wrap:focus-within {
  border-color: var(--color-action);
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.s-select-wrap--error {
  border-color: var(--color-risk);
}

/* Risk-state fields focus with --risk instead of --action. */
.s-select-wrap--error:focus-within {
  border-color: var(--color-risk);
  outline-color: var(--color-risk);
}

/* Chip-sized select — the phone filter row's "All groups ▾". */
.s-select-wrap--chip {
  border-radius: var(--radius-chip);
}

.s-select-wrap--chip .s-select {
  padding: 9px 26px 9px 11px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-fg-2);
}

.s-select-caret {
  position: absolute;
  right: 11px;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1;
  color: var(--color-fg-2);
  pointer-events: none;
}

.s-select-wrap--disabled {
  background: var(--color-surface);
  opacity: 0.6;
}

.s-select {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--color-fg);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  min-width: 0;
}

.s-select--md {
  padding: 10px 36px 10px 12px;
}

/* The shipment meta strip, matching SInput's `field`. */
.s-select--field {
  padding: 11px 36px 11px 12px;
}

.s-select:disabled {
  cursor: not-allowed;
  color: var(--color-fg-2);
}

.s-select-icon {
  position: absolute;
  right: 12px;
  color: var(--color-fg-3);
  pointer-events: none;
  flex-shrink: 0;
}
.s-cbx-hint {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--color-fg-3);
}

.s-cbx-hint--error { color: var(--color-risk); }
</style>
