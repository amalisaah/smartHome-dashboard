<script setup lang="ts" generic="T extends string | number">
import { ref, computed, watch, onMounted, onBeforeUnmount, useId } from 'vue'

const props = defineProps<{
  modelValue?: T
  label?: string
  options: { label: string; value: T }[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  required?: boolean
  freeText?: boolean
  addLabel?: string // override "Add '{query}'" prompt text
  /**
   * Enter with nothing matching creates, without an add row in the list — the
   * inline-create row carries its own create chip beside the field instead.
   */
  createOnEnter?: boolean
  /** Mono micro sitting inside the field, right-aligned: `no match in 214 items`. */
  hint?: string
  hideChevron?: boolean
  /** `row` is the 44px inline-create row at the foot of a table. */
  size?: 'md' | 'row'
  /** Use when the field has no visible label. */
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T | string]
  'add': [value: string] // fires when user confirms a new item
  /** The typed query, so the screen can count matches and label its own chip. */
  'update:query': [value: string]
}>()

/** The visible label has to name the field to the screen reader too. */
const fieldId = useId()

const query = ref('')
const open = ref(false)
const activeIndex = ref(-1)
const inputEl = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLUListElement | null>(null)
const rootEl = ref<HTMLDivElement | null>(null)

const displayValue = computed(() => {
  if (open.value) return query.value
  const match = props.options.find(o => o.value === props.modelValue)
  return match ? match.label : (props.modelValue != null ? String(props.modelValue) : '')
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(o => o.label.toLowerCase().includes(q))
})

// Show the add row when freeText is on, there's a query, and it isn't an exact match
const showAdd = computed(() => {
  if (!props.freeText || !query.value.trim()) return false
  const q = query.value.trim().toLowerCase()
  return !props.options.some(o => o.label.toLowerCase() === q)
})

// Total keyboard-navigable slots (list items + optional add row)
const totalSlots = computed(() => filtered.value.length + (showAdd.value ? 1 : 0))

/**
 * A field that reports its own emptiness — `no match in 209 items` — has said
 * it; a dropdown repeating "No matches" underneath is the same sentence twice.
 */
const showList = computed(
  () => open.value && (filtered.value.length > 0 || showAdd.value || !props.hint),
)
const addIndex = computed(() => filtered.value.length) // index of the add row

function setQuery(value: string) {
  query.value = value
  emit('update:query', value)
}

function addNew() {
  const val = query.value.trim()
  emit('update:modelValue', val)
  emit('add', val)
  setQuery('')
  open.value = false
  activeIndex.value = -1
}

function select(opt: { label: string; value: T }) {
  emit('update:modelValue', opt.value)
  setQuery('')
  open.value = false
  activeIndex.value = -1
}

function onInput(e: Event) {
  setQuery((e.target as HTMLInputElement).value)
  open.value = true
  activeIndex.value = -1
}

function onFocus() {
  setQuery('')
  open.value = true
  activeIndex.value = -1
}

function onBlur(e: FocusEvent) {
  if (rootEl.value?.contains(e.relatedTarget as Node)) return
  close()
}

function close() {
  setQuery('')
  open.value = false
  activeIndex.value = -1
}

/** Escape clears what was typed and stays in the field — it never exits the row. */
function clearQuery() {
  setQuery('')
  open.value = false
  activeIndex.value = -1
}

defineExpose({
  focus: () => inputEl.value?.focus(),
  clear: clearQuery,
})

function onKeydown(e: KeyboardEvent) {
  if (!open.value && e.key !== 'Enter') {
    open.value = true
    return
  }
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, totalSlots.value - 1)
      scrollActive()
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, 0)
      scrollActive()
      break
    case 'Enter':
      e.preventDefault()
      if (activeIndex.value === addIndex.value && showAdd.value) {
        addNew()
      } else if (activeIndex.value >= 0 && filtered.value[activeIndex.value]) {
        select(filtered.value[activeIndex.value])
      } else if (showAdd.value && query.value.trim()) {
        addNew()
      } else if (props.createOnEnter && query.value.trim() && filtered.value.length === 0) {
        addNew()
      }
      break
    case 'Escape':
      e.preventDefault()
      clearQuery()
      break
    case 'Tab':
      close()
      break
  }
}

function scrollActive() {
  const children = listEl.value?.children
  if (!children) return
  const el = children[activeIndex.value] as HTMLElement | undefined
  el?.scrollIntoView({ block: 'nearest' })
}

function onClickOutside(e: MouseEvent) {
  if (!rootEl.value?.contains(e.target as Node)) close()
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))

watch(() => props.modelValue, () => {
  if (!open.value) query.value = ''
})
</script>

<template>
  <div ref="rootEl" class="s-cbx-group">
    <label
      v-if="label"
      :for="fieldId"
      class="s-cbx-label"
      :class="{ 's-cbx-label--error': error }"
    >
      {{ label }}<span v-if="required" class="s-cbx-required"> *</span>
    </label>

    <div
      class="s-cbx-wrap"
      :class="[
        `s-cbx-wrap--size-${size ?? 'md'}`,
        {
          's-cbx-wrap--open': open,
          's-cbx-wrap--error': error,
          's-cbx-wrap--disabled': disabled,
        },
      ]"
    >
      <input
        ref="inputEl"
        :id="fieldId"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-expanded="open"
        :aria-label="ariaLabel"
        :aria-autocomplete="freeText ? 'both' : 'list'"
        autocomplete="off"
        role="combobox"
        class="s-cbx-input"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <span v-if="hint" class="s-cbx-field-hint">{{ hint }}</span>
      <button
        v-if="!hideChevron"
        class="s-cbx-chevron"
        :class="{ 's-cbx-chevron--open': open }"
        tabindex="-1"
        :disabled="disabled"
        @mousedown.prevent="open ? close() : inputEl?.focus()"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 5L7 9L11 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <ul v-if="showList" ref="listEl" role="listbox" class="s-cbx-list">
      <!-- Existing options -->
      <li
        v-for="(opt, i) in filtered"
        :key="String(opt.value)"
        role="option"
        :aria-selected="opt.value === modelValue"
        class="s-cbx-option"
        :class="{
          's-cbx-option--selected': opt.value === modelValue,
          's-cbx-option--active': i === activeIndex,
        }"
        @mousedown.prevent="select(opt)"
      >
        {{ opt.label }}
        <svg
          v-if="opt.value === modelValue"
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          aria-hidden="true" class="s-cbx-check"
        >
          <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </li>

      <!-- No matches (freeText off) -->
      <li v-if="filtered.length === 0 && !showAdd" class="s-cbx-empty">
        No matches
      </li>

      <!-- Add new row — always at the bottom when freeText + query -->
      <li
        v-if="showAdd"
        role="option"
        class="s-cbx-add"
        :class="{ 's-cbx-add--active': activeIndex === addIndex }"
        @mousedown.prevent="addNew"
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" class="s-cbx-add-icon">
          <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        <span>{{ addLabel ?? `Add "${query.trim()}"` }}</span>
      </li>
    </ul>

    <span v-if="error && errorMessage" class="s-cbx-hint s-cbx-hint--error">{{ errorMessage }}</span>
  </div>
</template>

<style scoped>
.s-cbx-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.s-cbx-label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-fg-2);
  letter-spacing: 0.01em;
}

.s-cbx-label--error { color: var(--color-risk); }
.s-cbx-required { color: var(--color-risk); }

.s-cbx-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-bg);
  transition: border-color 120ms ease-out, box-shadow 120ms ease-out;
  overflow: hidden;
}

/* Reaching for the field firms up its border, as on every other control. */
.s-cbx-wrap:hover:not(.s-cbx-wrap--open):not(:focus-within):not(.s-cbx-wrap--error) {
  border-color: var(--color-fg-3);
}

/* The one focus treatment the system has: the border takes the action colour
   and an outline sits just inside it. */
.s-cbx-wrap--open,
.s-cbx-wrap:focus-within {
  border-color: var(--color-action);
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.s-cbx-wrap--error { border-color: var(--color-risk); }

.s-cbx-wrap--error.s-cbx-wrap--open,
.s-cbx-wrap--error:focus-within {
  border-color: var(--color-risk);
  outline-color: var(--color-risk);
}

/* The inline-create row at the foot of a table. */
.s-cbx-wrap--size-row {
  min-height: 44px;
  border-radius: var(--radius-md);
  padding-right: 12px;
  gap: 8px;
}

.s-cbx-wrap--size-row .s-cbx-input {
  padding: 0 0 0 12px;
  align-self: stretch;
}

/* What the field knows about what was typed: `no match in 214 items`. */
.s-cbx-field-hint {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-micro);
  white-space: nowrap;
  margin-left: auto;
  flex-shrink: 0;
}

.s-cbx-wrap--disabled {
  background: var(--color-surface);
  opacity: 0.6;
  pointer-events: none;
}

.s-cbx-input {
  flex: 1;
  padding: 10px 0 10px 12px;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--color-fg);
  min-width: 0;
}

.s-cbx-input::placeholder { color: var(--color-fg-3); }

.s-cbx-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--color-fg-3);
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 120ms ease-out, color 120ms ease-out;
  padding: 0;
}

.s-cbx-chevron--open {
  transform: rotate(180deg);
  color: var(--color-fg-2);
}

/* Dropdown */
.s-cbx-list {
  position: absolute;
  top: calc(100%);
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-2);
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 220px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.s-cbx-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 7px;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--color-fg);
  cursor: pointer;
  transition: background 80ms ease-out;
  gap: 8px;
}

.s-cbx-option--active {
  background: var(--color-surface);
}

.s-cbx-option--selected {
  color: var(--color-action);
  font-weight: 500;
}

.s-cbx-check {
  color: var(--color-action);
  flex-shrink: 0;
}

.s-cbx-empty {
  padding: 10px;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-fg-3);
  text-align: center;
}

/* Add row */
.s-cbx-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 7px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-action);
  cursor: pointer;
  transition: background 80ms ease-out;
  border-top: 1px solid var(--color-divider);
  margin-top: 3px;
  padding-top: 10px;
}

.s-cbx-add--active,
.s-cbx-add:hover {
  background: oklch(0.55 0.13 255 / 0.07);
}

.s-cbx-add-icon {
  color: var(--color-action);
  flex-shrink: 0;
}

.s-cbx-hint {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--color-fg-3);
}

.s-cbx-hint--error { color: var(--color-risk); }
</style>
