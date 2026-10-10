<script setup lang="ts">
import { SText } from '@/components/atoms'
import type { CopyLine } from '@/types/customerDetail'

/**
 * One line of the removal copy. The counts inside a sentence are bold and the
 * joins between them are not, so a line is a run of segments rather than a
 * string — which also means nothing here interpolates a figure into prose and
 * then has to be trusted not to have changed it.
 */
withDefaults(
  defineProps<{
    line: CopyLine
    /** 13px in the cards' Goes / Stays grid, 14px in the delete dialog's cost block. */
    type?: 'row-meta' | 'cell'
    /** One ink down from the line's own — the cards take 0.45, the cost block 0.40. */
    quietColor?: 'fg-2' | 'fg-2-soft'
  }>(),
  { type: 'row-meta', quietColor: 'fg-2-soft' },
)
</script>

<template>
  <SText :type="type" color="fg" class="line">
    <span
      v-for="(segment, index) in line"
      :key="index"
      :class="[
        segment.strong && 'seg--strong',
        segment.quiet && `seg--quiet-${quietColor}`,
      ]"
    >{{ segment.text }}</span>
  </SText>
</template>

<style scoped>
/* The grid it sits in sets the leading, so a wrapped line keeps the rhythm of
   the column rather than the role's own. */
.line {
  line-height: inherit;
}

.seg--strong {
  font-weight: 600;
}

.seg--quiet-fg-2 {
  color: var(--color-fg-2);
}

.seg--quiet-fg-2-soft {
  color: var(--color-fg-2-soft);
}
</style>
