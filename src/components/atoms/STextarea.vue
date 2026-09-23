<script setup lang="ts">
import { ref, useId } from 'vue'

/**
 * The one field on this system that holds prose rather than a value. It focuses,
 * labels, and errors exactly as `SInput` does — it is the same field, given room
 * to wrap — so there is nothing new to learn at it.
 *
 * One size, deliberately: a paragraph is a paragraph, and a second set of
 * metrics for it would be a distinction with nothing behind it.
 */
const props = defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  /** How tall it opens. It grows from there by hand; it never shrinks below this. */
  rows?: number
  error?: boolean
  errorMessage?: string
  caption?: string
  required?: boolean
  disabled?: boolean
  /** Use when the field has no visible label. */
  ariaLabel?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

/** The visible label has to name the field to the screen reader too. */
const fieldId = useId()

const textareaEl = ref<HTMLTextAreaElement | null>(null)
defineExpose({ focus: () => textareaEl.value?.focus() })
</script>

<template>
  <div class="s-textarea-group">
    <label
      v-if="label"
      :for="fieldId"
      class="s-textarea-label"
      :class="{ 's-textarea-label--error': error }"
    >
      {{ label }}<span v-if="required" class="s-textarea-required"> *</span>
    </label>
    <div
      class="s-textarea-wrap"
      :class="{ 's-textarea-wrap--error': error, 's-textarea-wrap--disabled': disabled }"
    >
      <textarea
        ref="textareaEl"
        :id="fieldId"
        :value="modelValue"
        :rows="rows ?? 3"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="ariaLabel"
        class="s-textarea"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>
    <span v-if="error && errorMessage" class="s-textarea-hint s-textarea-hint--error">
      {{ errorMessage }}
    </span>
    <span v-else-if="caption" class="s-textarea-hint">{{ caption }}</span>
  </div>
</template>

<style scoped>
.s-textarea-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.s-textarea-label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-fg-2);
  letter-spacing: 0.01em;
}

.s-textarea-label--error {
  color: var(--color-risk);
}

.s-textarea-required {
  color: var(--color-risk);
}

.s-textarea-wrap {
  display: flex;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  transition: border-color 120ms ease-out, background-color 120ms ease-out;
}

/* Reaching for a field firms up its border before you are in it. */
.s-textarea-wrap:hover:not(:focus-within):not(.s-textarea-wrap--error):not(.s-textarea-wrap--disabled) {
  border-color: var(--color-fg-3);
}

/* Not live — the same treatment every other field takes: onto `--surface`,
   inert, and the prose still readable. */
.s-textarea-wrap--disabled {
  background: var(--color-surface);
  cursor: not-allowed;
}

.s-textarea-wrap:focus-within {
  border-color: var(--color-action);
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.s-textarea-wrap--error {
  border-color: var(--color-risk);
}

/* Risk-state fields focus with --risk instead of --action. */
.s-textarea-wrap--error:focus-within {
  border-color: var(--color-risk);
  outline-color: var(--color-risk);
}

.s-textarea {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  padding: 10px 12px;
  font-family: var(--font-sans);
  font-size: 14px;
  /* Prose that wraps takes leading; the fields that hold values do not. */
  line-height: 1.6;
  color: var(--color-fg);
  /* Taller by hand, never wider: widening it would break the frame it sits in. */
  resize: vertical;
}

.s-textarea::placeholder {
  color: var(--color-fg-3);
}

.s-textarea:disabled {
  color: var(--color-fg);
  cursor: not-allowed;
  /* Not resizable while it is not editable: the handle would be the one thing
     on a locked field that still answered. */
  resize: none;
}

.s-textarea-hint {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--color-fg-3);
}

.s-textarea-hint--error {
  color: var(--color-risk);
}
</style>
