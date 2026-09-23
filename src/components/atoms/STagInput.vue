<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import SBadge from './SBadge.vue'

/**
 * A field whose value is a list of short words — an item's keywords. It labels,
 * hovers and focuses exactly as `SInput` does, because it is a field; what is
 * different is that its value is already committed in front of him, chip by
 * chip, rather than sitting in a box waiting to be read back.
 *
 * The chips are `SBadge` — solid, because a keyword is his. The entry at the end
 * is where the next one is typed, and it is mono at chip size so a word looks
 * the same while it is being typed as it will once it is a chip.
 */
const props = defineProps<{
  modelValue: string[]
  label?: string
  /** What the entry at the end of the list says while it is empty. */
  placeholder?: string
  disabled?: boolean
  /** Read-only: the chips lose their `×` and the entry goes. The phone's posture. */
  readonly?: boolean
  /** `lg` is the phone door, matching the other fields in a stacked form. */
  size?: 'md' | 'lg'
  /** Use when there is no visible label. */
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  /** A tag landed or went. The screen saves on this, as it does on a blur. */
  commit: []
}>()

const fieldId = useId()

const query = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

/**
 * The last chip, armed by a Backspace in an empty entry. A second Backspace
 * takes it. Nothing is removed by the first press: a keystroke that deletes
 * something he cannot see is how a keyword list loses a word silently.
 */
const armed = ref(false)

const showEntry = computed(() => !props.readonly && !props.disabled)

function add(raw: string) {
  const tag = raw.trim().toLowerCase()
  query.value = ''
  armed.value = false
  if (!tag || props.modelValue.includes(tag)) return
  emit('update:modelValue', [...props.modelValue, tag])
  emit('commit')
}

function remove(tag: string) {
  armed.value = false
  emit('update:modelValue', props.modelValue.filter((it) => it !== tag))
  emit('commit')
}

function onKeydown(event: KeyboardEvent) {
  // A comma is how he separates words when speaking a list, so it commits too.
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    add(query.value)
    return
  }

  if (event.key === 'Backspace' && query.value === '' && props.modelValue.length > 0) {
    event.preventDefault()
    if (armed.value) remove(props.modelValue[props.modelValue.length - 1])
    else armed.value = true
    return
  }

  // Typing again disarms: he has moved on from the chip he was about to take.
  if (event.key.length === 1) armed.value = false

  // Escape clears what is half-typed and stays in the field, as SCombobox does.
  if (event.key === 'Escape') {
    event.preventDefault()
    query.value = ''
    armed.value = false
  }
}

/** Blurring with a word half-typed commits it — leaving is not discarding. */
function onBlur() {
  if (query.value.trim()) add(query.value)
  armed.value = false
}

/** The chips are not a tab stop, so clicking the box anywhere reaches the entry. */
function onBoxMousedown(event: MouseEvent) {
  if (event.target === event.currentTarget) inputEl.value?.focus()
}

defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<template>
  <div class="s-tags-group">
    <label v-if="label" :for="fieldId" class="s-tags-label">{{ label }}</label>
    <div
      class="s-tags-box"
      :class="[
        `s-tags-box--${size ?? 'md'}`,
        { 's-tags-box--readonly': readonly, 's-tags-box--disabled': disabled },
      ]"
      @mousedown="onBoxMousedown"
    >
      <SBadge
        v-for="(tag, index) in modelValue"
        :key="tag"
        variant="neutral"
        size="state"
        class="chip"
        :class="{ 'chip--armed': armed && index === modelValue.length - 1 }"
      >
        {{ tag }}
        <!-- Out of the tab order on purpose: the field is one tab stop, and the
             keyboard already removes a tag with Backspace. Three chips each
             taking a stop would make Keywords four stops and push every field
             below it out of the order the screen is read in. -->
        <button
          v-if="showEntry"
          type="button"
          class="remove"
          tabindex="-1"
          :aria-label="`Remove ${tag}`"
          @click="remove(tag)"
        >
          ×
        </button>
      </SBadge>

      <input
        v-if="showEntry"
        ref="inputEl"
        :id="fieldId"
        v-model="query"
        class="entry"
        type="text"
        autocomplete="off"
        :placeholder="placeholder ?? 'add…'"
        :aria-label="ariaLabel"
        @keydown="onKeydown"
        @blur="onBlur"
      />
    </div>
  </div>
</template>

<style scoped>
.s-tags-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.s-tags-label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-fg-2);
  letter-spacing: 0.01em;
}

.s-tags-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px;
  min-height: 44px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  cursor: text;
  transition: border-color 120ms ease-out;
}

/* Reaching for a field firms its border, as on every other field. */
.s-tags-box:hover:not(:focus-within):not(.s-tags-box--readonly):not(.s-tags-box--disabled) {
  border-color: var(--color-fg-3);
}

.s-tags-box:focus-within {
  border-color: var(--color-action);
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

/* The phone door. The chips keep their size — a keyword is the same word on
   either device — so the room goes into the box around them. */
.s-tags-box--lg {
  min-height: 48px;
  padding: 10px;
}

.s-tags-box--lg .entry {
  padding: 9px 8px;
}

/* Read-only: the words, with no box to suggest they can be changed here. */
.s-tags-box--readonly {
  padding: 0;
  min-height: 0;
  border-color: transparent;
  background: transparent;
  cursor: default;
}

.s-tags-box--disabled {
  background: var(--color-surface);
  cursor: not-allowed;
}

.chip {
  gap: 5px;
}

/* Armed by a Backspace: the ring, because the ring is this system's selection. */
.chip--armed {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.remove {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  line-height: 1;
  color: var(--color-fg-2);
  cursor: pointer;
  transition: color 120ms ease-out;
}

.remove:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 1px;
  border-radius: var(--radius-flag);
}

/* The mark is 11px; the thumb is not. The target grows around it without the
   chip growing, and stops at half the gap on each side — a wider one would
   overlap the next chip and take the wrong keyword. It is short of the 48px
   door on purpose: a 48px target here would force the chips 48px apart, and
   the chip list is drawn at 6px. The keyboard path is Backspace, which has no
   such limit. */
.remove {
  position: relative;
}

.remove::after {
  content: '';
  position: absolute;
  top: -10px;
  bottom: -10px;
  left: -3px;
  right: -3px;
}

/* Reaching for the `×` firms the whole chip and turns the mark itself to risk,
   so what is about to go is the chip and not just the character under the
   cursor. The chip does not move — nothing on this screen jumps under a hover. */
.chip:has(.remove:hover) {
  border-color: var(--color-fg-3);
}

.remove:hover {
  color: var(--color-risk);
}

/* The entry is a chip that has not become one yet: same family, same size, so a
   word does not change shape when it commits. */
.entry {
  flex: 1;
  min-width: 72px;
  border: none;
  outline: none;
  background: transparent;
  padding: 5px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-fg);
  line-height: normal;
}

.entry::placeholder {
  color: var(--color-micro);
}
</style>
