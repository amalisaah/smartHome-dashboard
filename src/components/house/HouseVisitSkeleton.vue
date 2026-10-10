<script setup lang="ts">
import { SText } from '@/components/atoms'
import { BLOCKS } from '@/data/houseVisitCopy'

/**
 * What stands while the house is being read.
 *
 * The block titles go up straight away and only the fields are blocked out, at
 * the heights they will really be — so the page he is waiting for is already
 * the page, and nothing moves under his thumb when it lands. No spinner: a
 * spinner would say "wait", and there is nothing here worth waiting for that he
 * cannot already see the shape of.
 */
defineProps<{ size?: 'phone' | 'desk' }>()

/** Rows per block, in order — the four fields that dominate each one. */
const SHAPE = [
  { block: BLOCKS.finding, bars: [96, 48, 46] },
  { block: BLOCKS.access, bars: [76, 44] },
  { block: BLOCKS.wiring, bars: [76, 44] },
  { block: BLOCKS.internet, bars: [48, 46] },
]
</script>

<template>
  <div class="skeleton" :class="`skeleton--${size ?? 'phone'}`" aria-hidden="true">
    <section v-for="row in SHAPE" :key="row.block.index" class="block">
      <div class="head">
        <SText type="screen-title" as="h2">{{ row.block.title }}</SText>
        <SText type="micro" color="micro">{{ row.block.index }}</SText>
      </div>
      <span
        v-for="(height, at) in row.bars"
        :key="at"
        class="bar"
        :style="{ height: `${height}px` }"
      />
    </section>
  </div>
</template>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 16px;
  border-bottom: 1px solid var(--color-line);
}

.skeleton--desk .block {
  padding: 24px 32px;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

/* The field's real height in the field's own ground, so the only thing that
   changes when the read lands is that there are words in it. */
.bar {
  display: block;
  background: var(--color-surface);
  border-radius: var(--radius-md);
}
</style>
