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
  <label class="s-checkbox" :class="{ 's-checkbox--disabled': disabled }">
    <span class="s-checkbox-box" :class="{ 's-checkbox-box--checked': modelValue }">
      <svg
        v-if="modelValue"
        width="11"
        height="9"
        viewBox="0 0 11 9"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1 4.5L4 7.5L10 1"
          stroke="white"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="s-checkbox-input"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
    </span>
    <span v-if="label" class="s-checkbox-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.s-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.s-checkbox--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.s-checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.s-checkbox-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid var(--color-fg-3);
  background: var(--color-bg);
  transition: all 120ms ease-out;
  flex-shrink: 0;
}

.s-checkbox-box--checked {
  background: var(--color-action);
  border-color: var(--color-action);
}

.s-checkbox-label {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--color-fg);
  line-height: 1.4;
}
</style>
