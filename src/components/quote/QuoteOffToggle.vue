<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'

/**
 * The switched-off lines, shown or hidden.
 *
 * **Dashed on purpose.** Across this surface, dashed means the system is holding
 * something rather than that he set it, and these are lines he took out but did
 * not delete. No button atom draws a dashed door, and the dash is the meaning
 * here rather than the decoration, so this is a control of its own — as the room
 * chips, the stepper and the hold pill all are.
 */
const props = defineProps<{ count: number; showing: boolean; phone?: boolean }>()
defineEmits<{ toggle: [] }>()

const label = computed(() => (props.showing ? 'Hide off' : `${props.count} off`))
</script>

<template>
  <button type="button" class="toggle" :class="{ 'toggle--phone': phone }" @click="$emit('toggle')">
    <SText type="list-meta" color="fg-2">{{ label }}</SText>
  </button>
</template>

<style scoped>
.toggle {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  background: transparent;
  border: 1px dashed var(--color-fg-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 120ms ease-out, background-color 120ms ease-out;
}

.toggle--phone {
  min-height: var(--hit-min);
  padding: 0 12px;
}

.toggle:hover {
  border-color: var(--color-fg-2);
}

.toggle:active {
  background: var(--color-surface);
}

.toggle:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}
</style>
