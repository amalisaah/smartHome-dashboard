<script setup lang="ts">
import { computed } from 'vue'
import { needOptions } from '@/types/quote'

/**
 * The line's need, at the desk.
 *
 * Dashed while it is the catalogue's guess, solid once he changes it — the same
 * rule the phone's chips state, in the shape a table row can hold. `SSelect`
 * carries no dashed door, and here the dash is the meaning rather than the
 * decoration, so this is its own control.
 *
 * A native `<select>` on purpose: it is one tab stop, it opens with the keyboard
 * alone, and the eight needs do not need searching.
 */
const props = defineProps<{
  value: string
  defaultNeed: string | null
  label: string
  disabled?: boolean
}>()
defineEmits<{ pick: [need: string] }>()

/** Still the one it came with. */
const isDefault = computed(() => props.value === props.defaultNeed)

const options = computed(() => needOptions(props.value))
</script>

<template>
  <select
    class="need"
    :class="{ 'need--default': isDefault }"
    :value="value"
    :disabled="disabled"
    :aria-label="`Need, ${label}`"
    @change="$emit('pick', ($event.target as HTMLSelectElement).value)"
  >
    <option v-for="need in options" :key="need" :value="need">{{ need }}</option>
  </select>
</template>

<style scoped>
.need {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-fg);
  background: var(--color-bg);
  border: 1px solid var(--color-fg-3);
  border-radius: var(--radius-md);
  padding: 6px 8px;
  cursor: pointer;
  min-width: 0;
  transition: border-color 120ms ease-out;
}

/* The catalogue's, not his. */
.need--default {
  border-style: dashed;
}

.need:hover:not(:disabled) {
  border-color: var(--color-fg-2);
}

/* Not live, but still his record to read: the value keeps full ink. */
.need:disabled {
  background: var(--color-surface);
  color: var(--color-fg);
  cursor: not-allowed;
}

.need:focus-visible {
  border-color: var(--color-action);
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}
</style>
