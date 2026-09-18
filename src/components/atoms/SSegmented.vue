<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T
  options: { label: string; value: T }[]
  /** `lg` is the allocation-basis door: taller, and the selection weighs 600. */
  size?: 'md' | 'lg'
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <div class="s-seg" :class="`s-seg--${size ?? 'md'}`" role="tablist">
    <button
      v-for="opt in options"
      :key="opt.value"
      role="tab"
      :aria-selected="modelValue === opt.value"
      :disabled="disabled"
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

/* The taller door. No gap between the segments: the track is one object, and
   the selection is a tile inside it. */
.s-seg--lg {
  border-radius: var(--radius-md);
  gap: 0;
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
  /* The selection settles rather than sliding: background and shadow move,
     the tile does not travel. */
  transition: background-color 150ms ease-out, box-shadow 150ms ease-out,
    color 120ms ease-out;
  white-space: nowrap;
}

.s-seg--lg .s-seg-option {
  height: auto;
  padding: 9px 14px;
  border-radius: var(--radius-chip);
  color: var(--color-fg-2-soft);
}

.s-seg-option:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

/* Hovering an unselected segment brings its label up to full ink; the tile
   itself stays put until it is the selection. */
.s-seg-option:not(.s-seg-option--active):not(:disabled):hover {
  color: var(--color-fg);
}

.s-seg-option:disabled {
  cursor: default;
}

.s-seg-option--active {
  background: var(--color-bg);
  color: var(--color-fg);
  box-shadow: var(--shadow-elev-1);
}

.s-seg--lg .s-seg-option--active {
  font-weight: 600;
  color: var(--color-fg);
  box-shadow: var(--shadow-elev-0);
}
</style>
