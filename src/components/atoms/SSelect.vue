<script setup lang="ts" generic="T extends string | number">
defineProps<{
  modelValue?: T
  label?: string
  options: { label: string; value: T }[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  required?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <div class="s-select-group">
    <label v-if="label" class="s-select-label" :class="{ 's-select-label--error': error }">
      {{ label }}<span v-if="required" class="s-select-required"> *</span>
    </label>
    <div class="s-select-wrap" :class="{ 's-select-wrap--error': error, 's-select-wrap--disabled': disabled }">
      <select
        :value="modelValue"
        :disabled="disabled"
        class="s-select"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value as T)"
      >
        <option v-if="placeholder" value="" disabled :selected="modelValue === undefined || modelValue === ''">
          {{ placeholder }}
        </option>
        <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <svg class="s-select-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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
  border-radius: var(--radius-card);
  background: var(--color-bg);
  transition: border-color 120ms ease-out, box-shadow 120ms ease-out;
}

.s-select-wrap:focus-within {
  border-color: var(--color-action);
  box-shadow: 0 0 0 3px oklch(0.55 0.13 255 / 0.12);
}

.s-select-wrap--error {
  border-color: var(--color-risk);
}

.s-select-wrap--error:focus-within {
  border-color: var(--color-risk);
  box-shadow: 0 0 0 3px oklch(0.55 0.13 45 / 0.12);
}

.s-select-wrap--disabled {
  background: var(--color-surface);
  opacity: 0.6;
}

.s-select {
  flex: 1;
  padding: 10px 36px 10px 12px;
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
