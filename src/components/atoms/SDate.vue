<script setup lang="ts">
import { computed } from 'vue'
import SInput from './SInput.vue'

/**
 * A date is picked, not typed as prose. The value is ISO — `2026-09-03` — which
 * is the only shape a date control speaks, and the shape the API already wants.
 * Everything else about the field is SInput's: the label, the doors, the one
 * focus treatment, the error ink.
 */
const props = defineProps<{
  modelValue?: string
  label?: string
  /** SInput's doors. `field` is the shipment meta strip. */
  size?: 'md' | 'lg' | 'field'
  required?: boolean
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  caption?: string
  /** Use when the field has no visible label. */
  ariaLabel?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

/** Empty, the browser writes its own `dd/mm/yyyy` where the value would go. */
const empty = computed(() => !props.modelValue)
</script>

<template>
  <SInput
    v-bind="props"
    type="date"
    mono
    class="s-date"
    :class="{ 's-date--empty': empty }"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<style scoped>
.s-date :deep(.s-input) {
  accent-color: var(--color-action);
}

/* `dd/mm/yyyy` is a placeholder, and placeholders are fg-3 everywhere else. */
.s-date--empty :deep(.s-input) {
  color: var(--color-fg-3);
}

/* The calendar button is the browser's own glyph and cannot take a token
   colour, so it takes the quiet inks' weight instead: held back at rest, full
   when reached for. */
.s-date :deep(.s-input)::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.45;
  transition: opacity 120ms ease-out;
}

.s-date :deep(.s-input)::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.s-date :deep(.s-input:disabled)::-webkit-calendar-picker-indicator {
  cursor: not-allowed;
  opacity: 0.25;
}
</style>
