<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * What is wrong with a line, said as a count and never as a unit.
 *
 * `1 of 2 faulty` is the whole answer, and it is deliberately the whole answer:
 * this record has no serial, no position and no "the one by the window", so
 * asking which one would be asking a question nothing here can hold. The note
 * beside it is where a person says the rest in their own words.
 *
 * Both are supplied. The pill in particular is **not** derived from the faulty
 * and active columns — the reference draws `1 of 2 faulty` on a line reading 2
 * and 1, so it counts something the columns do not, and a screen that
 * recalculated it would quietly contradict the record.
 */
defineProps<{ pill: string | null; note: string | null; size?: 'phone' | 'desk' }>()
</script>

<template>
  <span v-if="pill || note" class="fault" :class="`fault--${size ?? 'desk'}`">
    <span v-if="pill" class="pill">{{ pill }}</span>
    <SText v-if="note" type="cell-meta" color="fg-2-soft">{{ note }}</SText>
  </span>
</template>

<style scoped>
/* One line, and the note wraps inside it rather than dropping below the pill:
   the count and the words about it are one statement, and breaking them apart
   puts a bare `1 of 2 faulty` on a line of its own. */
.fault {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* The one filled amber thing on the screen. Filled rather than outlined because
   it is the answer to "what am I here for", and it has to be found by scanning
   a room list rather than by reading it. */
.pill {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: normal;
  padding: 2px 7px;
  border-radius: var(--radius-flag);
  background: var(--color-risk);
  color: var(--color-bg);
  white-space: nowrap;
}

/* A thumb's reach away from a device name rather than a cell's, so the phone's
   pill sits a touch taller in its own line. */
.fault--phone .pill {
  padding: 3px 7px;
}
</style>
