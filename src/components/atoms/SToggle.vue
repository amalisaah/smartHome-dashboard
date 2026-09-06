<script setup lang="ts">
defineProps<{
  modelValue?: boolean
  label?: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label class="s-toggle" :class="{ 's-toggle--disabled': disabled }">
    <span class="s-toggle-track" :class="{ 's-toggle-track--on': modelValue }">
      <span class="s-toggle-dot" :class="{ 's-toggle-dot--on': modelValue }"></span>
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="s-toggle-input"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
    </span>
    <span v-if="label" class="s-toggle-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.s-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.s-toggle--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.s-toggle-track {
  position: relative;
  width: 40px;
  height: 24px;
  border-radius: var(--radius-pill);
  background: var(--color-line);
  transition: background 120ms ease-out;
  flex-shrink: 0;
}

.s-toggle-track--on {
  background: var(--color-action);
}

.s-toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.s-toggle-dot {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px oklch(0 0 0 / 0.2);
  transition: transform 120ms ease-out;
}

.s-toggle-dot--on {
  transform: translateX(16px);
}

.s-toggle-label {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--color-fg);
}
</style>
