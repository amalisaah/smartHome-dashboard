<script setup lang="ts">
import { SText } from '@/components/atoms'
import { needOptions } from '@/types/quote'

/**
 * What the line is for, as the eight fixed needs.
 *
 * **Solid is his, dashed is the system's.** The chip carrying the item's group
 * default is dashed while it stands, because it is a guess the catalogue made —
 * a smart plug ordered for a lamp is still a lighting problem solved. The
 * moment he picks one, it fills: he decided.
 *
 * Chips rather than a select because he is doing this one-handed in somebody's
 * living room, and because eight is few enough to see at once.
 */
defineProps<{ value: string; defaultNeed: string | null }>()
defineEmits<{ pick: [need: string] }>()
</script>

<template>
  <div class="chips">
    <button
      v-for="need in needOptions(value)"
      :key="need"
      type="button"
      class="chip"
      :class="{
        'chip--on': need === value,
        'chip--default': need === defaultNeed && need !== value,
      }"
      :aria-pressed="need === value"
      @click="$emit('pick', need)"
    >
      <SText type="list-meta" as="span" class="label">{{ need }}</SText>
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 10px;
  background: transparent;
  color: var(--color-fg-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-chip);
  cursor: pointer;
  transition: background-color 120ms ease-out, border-color 120ms ease-out, color 120ms ease-out;
}

.chip .label {
  color: inherit;
}

.chip:hover {
  border-color: var(--color-fg-3);
}

.chip:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

/* The catalogue's guess, still standing. */
.chip--default {
  border-style: dashed;
  border-color: var(--color-fg-3);
}

/* His. */
.chip--on {
  background: var(--color-action);
  border-color: var(--color-action);
  color: var(--color-bg);
}

.chip--on:hover {
  border-color: var(--color-action);
}
</style>
