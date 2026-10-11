<script setup lang="ts">
import { computed } from 'vue'
import { handChip, jobChip } from '@/data/installedCopy'
import type { WrittenBy } from '@/types/installed'

/**
 * Who put this line in the record, in the system's own language rather than in
 * a word: **dashed is the system's, solid is his.**
 *
 * It is the one piece of provenance the screen carries, and it is what lets a
 * stranger a year from now weigh a count — a job wrote it while standing in the
 * room, or somebody typed it from memory afterwards. Any count changed in
 * correction mode flips its row to the solid chip on the spot, because the
 * moment it is changed by hand that is what it is.
 */
const props = defineProps<{ source: WrittenBy; date: string }>()

const label = computed(() =>
  props.source === 'hand' ? handChip(props.date) : jobChip(props.date),
)

const described = computed(() =>
  props.source === 'hand'
    ? `Corrected by hand on ${props.date}`
    : `Written by a job on ${props.date}`,
)
</script>

<template>
  <span class="chip" :class="`chip--${source}`" :title="described">{{ label }}</span>
</template>

<style scoped>
.chip {
  justify-self: start;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: normal;
  padding: 3px 8px;
  border-radius: var(--radius-chip);
  white-space: nowrap;
  border: 1px solid transparent;
}

.chip--job {
  border-style: dashed;
  border-color: var(--color-fg-3);
  color: var(--color-fg-2-soft);
}

.chip--hand {
  border-color: var(--color-fg);
  color: var(--color-fg);
}
</style>
