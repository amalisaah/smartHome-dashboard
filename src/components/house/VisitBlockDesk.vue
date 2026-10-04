<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * One of A3's four blocks — the same block as A1, read as a document.
 *
 * The labels move into a 160px left gutter so the four read down the page and
 * he can see at a glance which one he skipped. Nothing new is captured here:
 * same fields, same words, same order. The laptop's job is to tidy the visit
 * before quoting, not to do it again.
 *
 * `boxed` is Wiring and only Wiring, here too — with the gutter inside the box,
 * so the block's own label is part of what the border lifts.
 */
defineProps<{
  index: string
  title: string
  boxed?: boolean
  /** Shortened here: he read the long version standing in her house. */
  helper?: string
}>()
</script>

<template>
  <section class="block" :class="{ 'block--boxed': boxed }">
    <div class="inner">
      <div class="gutter">
        <SText type="micro" color="micro" class="index">{{ index }}</SText>
        <SText type="screen-title" as="h2">{{ title }}</SText>
        <SText v-if="helper" type="caption" class="helper">{{ helper }}</SText>
      </div>

      <div class="field">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.block {
  border-bottom: 1px solid var(--color-line);
}

.block:last-child {
  border-bottom: none;
}

.inner {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 24px;
  padding: 24px 0;
}

/* The column's own ends. The body grid above already sets the page's 24px, so
   the first block's gutter would otherwise read as twice the gap of every
   other, and the last would hang 20px of nothing under the final rule. */
.block:first-child .inner {
  padding-top: 4px;
}

.block:last-child .inner {
  padding-bottom: 4px;
}

/* A box standing in a column of rules needs air above and below it, and the
   rule it would otherwise sit on belongs to the block, not to the box. */
.block--boxed .inner {
  padding: 18px 20px;
  margin: 20px 0;
  border: 2px solid var(--color-fg);
  border-radius: var(--radius-card);
}

.gutter {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* The document's index, not a table header: it is read down the gutter rather
   than across a row, so it keeps the tighter tracking. */
.index {
  letter-spacing: 0.12em;
  text-transform: none;
}

.helper {
  line-height: 1.5;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
</style>
