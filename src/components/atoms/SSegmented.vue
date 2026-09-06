<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T
  options: { label: string; value: T }[]
}>()

defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <div class="s-seg" role="tablist">
    <button
      v-for="opt in options"
      :key="opt.value"
      role="tab"
      :aria-selected="modelValue === opt.value"
      class="s-seg-option"
      :class="{ 's-seg-option--active': modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.s-seg {
  display: inline-flex;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  padding: 3px;
  gap: 2px;
}

.s-seg-option {
  flex: 1;
  height: 32px;
  padding: 0 14px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-fg-2);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 120ms ease-out;
  white-space: nowrap;
}

.s-seg-option:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.s-seg-option--active {
  background: var(--color-bg);
  color: var(--color-fg);
  box-shadow: var(--shadow-elev-1);
}
</style>
