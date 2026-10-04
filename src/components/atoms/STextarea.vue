<script setup lang="ts">
import { nextTick, ref, useId } from 'vue'

/**
 * The one field on this system that holds prose rather than a value. It focuses,
 * labels, and errors exactly as `SInput` does — it is the same field, given room
 * to wrap — so there is nothing new to learn at it.
 *
 * One look, deliberately: a paragraph is a paragraph, and a second set of
 * metrics for it would be a distinction with nothing behind it. The one
 * distinction with something behind it is the device — see `size`.
 */
const props = defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  /** How tall it opens. It grows from there by hand; it never shrinks below this. */
  rows?: number
  /**
   * `phone` is the same field at the phone door: 16px, which is the size below
   * which iOS zooms the page on focus — the same reason `SInput` carries a
   * `phone` size. It is not a second look, it is the one look at the size a
   * thumb can type into, and it does not resize, because a drag handle is not
   * something a thumb reaches for.
   */
  size?: 'md' | 'phone'
  /**
   * Whether the label names the field or prompts for it, as on `SInput`. `sm`
   * (12px) is the default; `md` (13px) is a form's principal field.
   */
  labelSize?: 'sm' | 'md'
  error?: boolean
  errorMessage?: string
  caption?: string
  required?: boolean
  disabled?: boolean
  /** Use when the field has no visible label. */
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

/** The visible label has to name the field to the screen reader too. */
const fieldId = useId()

const textareaEl = ref<HTMLTextAreaElement | null>(null)

/** Puts the caret back where the insert left it, after the value has re-rendered. */
function restore(el: HTMLTextAreaElement, at: number) {
  nextTick(() => {
    el.focus()
    el.setSelectionRange(at, at)
  })
}

/**
 * Types `text` in, the way a key would: at the caret, over any selection, caret
 * after it, focus left in the field.
 *
 * This is the one way anything but the keyboard may put words in here, and it
 * exists for one thing — a phrase chip beside the field, which is a shortcut
 * for typing and not a value of its own. It writes into the prose and nothing
 * else: there is no flag behind it, and what it inserts he can edit or delete
 * like any other word.
 *
 * With no caret — the field has not been touched — it appends instead, joined
 * the way the sentence before it ended: a full stop and a space after a word,
 * a single space after punctuation, nothing at all when the field is empty.
 */
function insert(text: string) {
  const el = textareaEl.value
  if (!el) return

  const value = el.value

  if (document.activeElement === el) {
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? start
    emit('update:modelValue', value.slice(0, start) + text + value.slice(end))
    restore(el, start + text.length)
    return
  }

  const before = value.replace(/\s+$/, '')
  const join = before === '' ? '' : /[.!?,;:—–-]$/.test(before) ? ' ' : '. '
  const next = before + join + text
  emit('update:modelValue', next)
  restore(el, next.length)
}

defineExpose({ focus: () => textareaEl.value?.focus(), insert })
</script>

<template>
  <div class="s-textarea-group" :class="`s-textarea-group--size-${size ?? 'md'}`">
    <label
      v-if="label"
      :for="fieldId"
      class="s-textarea-label"
      :class="[`s-textarea-label--${labelSize ?? 'sm'}`, { 's-textarea-label--error': error }]"
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
        :class="`s-textarea--${size ?? 'md'}`"
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

/* A form's principal field, as on `SInput`. */
.s-textarea-label--md {
  font-size: 13px;
}

/* Above a 16px field, the tracking a 12px laptop label needs only makes it
   looser than the prose under it. */
.s-textarea-group--size-phone .s-textarea-label {
  letter-spacing: normal;
}

/* An optional field's label asks a question rather than naming a value. */
.s-textarea-group--size-phone .s-textarea-label--sm:not(.s-textarea-label--error) {
  color: var(--color-fg-2-soft);
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

/* The phone door. 16px because anything under it zooms the page on iOS, 1.5
   leading because at 16px that is what the drawn four-row field stands at, and
   no resize handle because a thumb has nothing to drag it with. */
.s-textarea--phone {
  padding: 12px;
  font-size: 16px;
  line-height: 1.5;
  resize: none;
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
