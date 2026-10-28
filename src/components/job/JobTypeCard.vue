<script setup lang="ts">
import { SText } from '@/components/atoms'
import { JOB_TYPES } from '@/types/job'
import type { ApiJobType } from '@/types/jobApi'

defineProps<{
  modelValue: ApiJobType
  /** The sentence under the tiles, already carrying the device count. */
  consequence: string
  /** Completed or cancelled: the choice is made and the tiles are gone. */
  readOnly: boolean
}>()

defineEmits<{ 'update:modelValue': [value: ApiJobType] }>()
</script>

<template>
  <section class="card">
    <SText type="heading" as="h2">What this job does to her house</SText>

    <!-- Four tiles, not a dropdown. The four are four different writes to her
         house record, and a dropdown would hide which one behind a click. A
         radio group, so the arrow keys move between them as he expects. -->
    <div v-if="!readOnly" class="tiles" role="radiogroup" aria-label="What this job does to her house">
      <button
        v-for="type in JOB_TYPES"
        :key="type.value"
        type="button"
        role="radio"
        :aria-checked="modelValue === type.value"
        class="tile"
        :class="{ 'tile--on': modelValue === type.value }"
        @click="$emit('update:modelValue', type.value)"
      >
        <span class="tile-name">{{ type.name }}</span>
        <span class="tile-short">{{ type.short }}</span>
      </button>
    </div>

    <!-- Read-only: the one that was chosen, with nothing to suggest it can be
         changed here. There is no reopen, so an inert row of four would be
         four things he cannot do. -->
    <div v-else class="settled">
      <SText type="label" color="fg-2-soft">Recorded as</SText>
      <SText type="pane-title">{{ JOB_TYPES.find((t) => t.value === modelValue)?.name }}</SText>
    </div>

    <p class="consequence">{{ consequence }}</p>
  </section>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 14px;
  text-align: left;
  background: var(--color-bg);
  color: var(--color-fg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 120ms ease-out, border-color 120ms ease-out,
    color 120ms ease-out;
}

/* Reaching for a tile firms its border, the way reaching for a field does. */
.tile:hover:not(.tile--on) {
  border-color: var(--color-fg-3);
}

.tile:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.tile--on {
  background: var(--color-action);
  border-color: var(--color-action);
  color: var(--color-bg);
  cursor: default;
}

.tile-name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
}

/* Inside the tile, so it takes the tile's own ink at either state rather than
   a token that would be wrong on one of the two grounds. */
.tile-short {
  font-family: var(--font-sans);
  font-size: 13px;
  opacity: 0.85;
}

.settled {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

/* The sentence the tiles are for. 15px because it is the thing on this card he
   actually reads, and it must not look like a caption under the controls. */
.consequence {
  margin: 0;
  padding: 12px 14px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.55;
  color: var(--color-fg);
  text-wrap: pretty;
}
</style>
