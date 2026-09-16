<script setup lang="ts">
defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  prefix?: string
  derived?: boolean
  error?: boolean
  errorMessage?: string
  caption?: string
  type?: string
  required?: boolean
  disabled?: boolean
  /** `on-dark` is the field that sits on the dark app bar / phone header. */
  variant?: 'default' | 'on-dark'
  /** `lg` is the >=48px phone door. */
  size?: 'md' | 'lg'
  /** Use when the field has no visible label. */
  ariaLabel?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="s-input-group">
    <label v-if="label" class="s-input-label" :class="{ 's-input-label--error': error }">
      {{ label }}<span v-if="required" class="s-input-required"> *</span>
    </label>
    <div
      class="s-input-wrap"
      :class="[
        `s-input-wrap--${variant ?? 'default'}`,
        {
          's-input-wrap--error': error,
          's-input-wrap--derived': derived,
          's-input-wrap--has-prefix': prefix,
        },
      ]"
    >
      <span v-if="prefix" class="s-input-prefix">{{ prefix }}</span>
      <input
        :value="modelValue"
        :type="type ?? 'text'"
        :placeholder="placeholder"
        :disabled="disabled || derived"
        :readonly="derived"
        :aria-label="ariaLabel"
        class="s-input"
        :class="[`s-input--${size ?? 'md'}`, { 's-input--derived': derived }]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
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

.s-input-prefix {
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-line);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-fg-2);
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;
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

.s-input::placeholder {
  color: var(--color-fg-3);
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
