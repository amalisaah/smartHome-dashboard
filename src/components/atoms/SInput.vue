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
      :class="{
        's-input-wrap--error': error,
        's-input-wrap--derived': derived,
        's-input-wrap--has-prefix': prefix,
      }"
    >
      <span v-if="prefix" class="s-input-prefix">{{ prefix }}</span>
      <input
        :value="modelValue"
        :type="type ?? 'text'"
        :placeholder="placeholder"
        :disabled="disabled || derived"
        :readonly="derived"
        class="s-input"
        :class="{ 's-input--derived': derived }"
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
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--color-bg);
  transition: border-color 120ms ease-out, box-shadow 120ms ease-out;
}

.s-input-wrap:focus-within {
  border-color: var(--color-action);
  box-shadow: 0 0 0 3px oklch(0.55 0.13 255 / 0.12);
}

.s-input-wrap--error {
  border-color: var(--color-risk);
}

.s-input-wrap--error:focus-within {
  border-color: var(--color-risk);
  box-shadow: 0 0 0 3px oklch(0.55 0.13 45 / 0.12);
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
  padding: 10px 12px;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--color-fg);
  min-width: 0;
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
