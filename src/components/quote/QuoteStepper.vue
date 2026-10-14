<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * A line's quantity.
 *
 * **The minimum is one.** Taking a line out of a quote is switching it off, not
 * stepping it to nothing: a line at zero would be a line he has to remember to
 * remove, and a quote that silently contained one would be wrong in a way
 * nobody could see. That is why this is not `@/components/house/CountStepper`,
 * which counts devices in a room and is right to allow zero.
 *
 * Buttons, so Tab reaches them and Space or Enter steps them.
 */
defineProps<{ value: number; label: string; phone?: boolean }>()
defineEmits<{ step: [by: 1 | -1] }>()
</script>

<template>
  <div class="stepper" :class="{ 'stepper--phone': phone }">
    <button
      type="button"
      class="key"
      :disabled="value <= 1"
      :aria-label="`One fewer, ${label}`"
      @click="$emit('step', -1)"
    >
      −
    </button>
    <!-- Drawn mono 18 on the phone and mono 14 at the desk. `list-figure` (16)
         is the nearest role to 18; `count` is 14 exactly. -->
    <SText :type="phone ? 'list-figure' : 'count'" class="value" aria-live="polite">
      {{ value }}
    </SText>
    <button type="button" class="key" :aria-label="`One more, ${label}`" @click="$emit('step', 1)">
      +
    </button>
  </div>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.key {
  width: 36px;
  height: 34px;
  font-family: var(--font-sans);
  font-size: 16px;
  color: var(--color-fg);
  background: var(--color-surface);
  border: none;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.stepper--phone .key {
  width: var(--hit-min);
  height: var(--hit-min);
  font-size: 20px;
  background: var(--color-bg);
}

.key:hover:not(:disabled) {
  background: var(--color-row-hover);
}

.key:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

/* At one, there is nowhere down to go — the way out is Switch off. */
.key:disabled {
  color: var(--color-fg-3);
  cursor: not-allowed;
}

.value {
  width: 40px;
  text-align: center;
}

.stepper--phone .value {
  width: 52px;
}
</style>
