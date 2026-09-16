<script setup lang="ts">
import { SText } from '@/components/atoms'

defineProps<{
  tabs: string[]
  active: string
}>()

defineEmits<{ select: [tab: string] }>()
</script>

<template>
  <nav class="tab-bar" aria-label="Sections">
    <button
      v-for="tab in tabs"
      :key="tab"
      type="button"
      class="tab"
      :class="{ 'tab--active': tab === active }"
      :aria-current="tab === active ? 'page' : undefined"
      @click="$emit('select', tab)"
    >
      <SText type="tab" :color="tab === active ? 'fg' : 'fg-2-soft'">{{ tab }}</SText>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  display: flex;
  gap: 4px;
  padding: 8px 16px 0;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.tab {
  padding: 10px 14px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 120ms ease-out, border-color 120ms ease-out;
}

.tab:hover :deep(.s-text) {
  color: var(--color-fg);
}

.tab:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.tab--active {
  border-bottom-color: var(--color-action);
}

.tab--active :deep(.s-text) {
  font-weight: 600;
}
</style>
