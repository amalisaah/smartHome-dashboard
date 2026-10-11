<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import { FOOTER_LINES, WALK_THE_ROOMS } from '@/data/houseVisitCopy'

/**
 * A1's footer, and **the only button on the screen.**
 *
 * There is nothing to save here, so there is nothing to press to save it: the
 * line on the left says where the words already are, and the button on the
 * right moves him on to the next part of the walk. A screen whose one button
 * means "go" cannot be misread as a screen whose one button means "commit".
 */
defineEmits<{ walk: [] }>()
</script>

<template>
  <div class="footer">
    <SText type="cell-meta" class="kept">
      <template v-for="(line, index) in FOOTER_LINES" :key="line">
        <br v-if="index" />{{ line }}
      </template>
    </SText>

    <SButton size="phone-cta" @click="$emit('walk')">{{ WALK_THE_ROOMS }}</SButton>
  </div>
</template>

<style scoped>
/* Sticky rather than fixed: it belongs to the scroll it sits at the end of, and
   the shadow above it is what says there is more under it. */
.footer {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg);
  box-shadow: 0 -1px 0 var(--color-line), 0 -6px 16px oklch(0.21 0.01 260 / 0.06);
}

/* Two lines, broken where the design breaks them — it is a statement, not a
   paragraph that happens to wrap. */
.kept {
  line-height: 1.5;
}
</style>
