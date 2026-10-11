<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * One of A1's four blocks. They are in the order he meets things — gate, then
 * inside, then a wall box, then the back of the house — so the scroll is the
 * walk, and the index in the corner is how far along it he is.
 *
 * `boxed` is **Wiring and only Wiring.** A 2px ink border lifts it off the
 * scroll so it cannot be skimmed past, because whether the wall boxes have a
 * neutral decides whether the job is possible at all. Nothing else on this
 * screen may take the box: a second one would make the first mean nothing.
 */
defineProps<{
  /** `01`–`04`. */
  index: string
  title: string
  boxed?: boolean
  /** Why the block is here. Drawn under the title, inside the box. */
  helper?: string
}>()
</script>

<template>
  <section class="block" :class="{ 'block--boxed': boxed }">
    <div class="inner">
      <div class="head">
        <div class="titles">
          <SText type="screen-title" as="h2">{{ title }}</SText>
          <SText type="micro" color="micro">{{ index }}</SText>
        </div>
        <SText v-if="helper" type="meta" color="fg-2-soft">{{ helper }}</SText>
      </div>

      <slot />
    </div>
  </section>
</template>

<style scoped>
.block {
  border-bottom: 1px solid var(--color-line);
}

.inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 16px;
}

/* The band is what the box sits on: it pulls the block off the white scroll
   before the border does, so the lift reads before the ink does. */
.block--boxed {
  padding: 14px 12px;
  background: var(--color-surface);
}

.block--boxed .inner {
  padding: 16px 14px;
  background: var(--color-bg);
  border: 2px solid var(--color-fg);
  border-radius: var(--radius-card);
}

.head {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Baseline, not centre: the 10px index sits on the 17px title's line rather
   than in the middle of it. */
.titles {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
</style>
