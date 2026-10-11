<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { SText } from '@/components/atoms'
import {
  ACCESS_KEY,
  BEFORE_YOU_TOUCH,
  INTERNET_KEY,
  VISIT_NOTES_LINK,
  WIRING_KEY,
} from '@/data/installedCopy'
import type { BeforeYouTouch } from '@/types/installed'

/**
 * The three lines a fixer reads before touching a switch.
 *
 * They are at the **top** of the phone and in the **first** card at the desk,
 * above and beside the list rather than inside it, because the person reading
 * this screen has never been in the building: whether there is a neutral,
 * whether there is signal, and whether the dog is tied decide what happens next
 * more than any count below them does.
 *
 * Read-only, and summaries — the words themselves live on Visit notes, which is
 * where they were written and where the link goes.
 */
defineProps<{
  facts: BeforeYouTouch
  customerId: number
  houseId: number
  /** `phone` is the strip under the tabs; `desk` the card beside the table. */
  size?: 'phone' | 'desk'
}>()
</script>

<template>
  <section class="block" :class="`block--${size ?? 'phone'}`">
    <div class="head">
      <SText
        :type="size === 'desk' ? 'column-header' : 'micro'"
        color="micro"
        as="h2"
      >
        {{ BEFORE_YOU_TOUCH }}
      </SText>
      <RouterLink
        v-if="size === 'desk'"
        :to="{ name: 'house-detail', params: { id: customerId, houseId } }"
        class="link"
      >
        <SText type="tab" color="action-ink">{{ VISIT_NOTES_LINK }}</SText>
      </RouterLink>
    </div>

    <dl class="facts">
      <dt><SText type="cell-meta" color="fg-2-soft">{{ WIRING_KEY }}</SText></dt>
      <!-- Weighted, and the only one that is: a box with no neutral in it is
           the fact that decides whether the job can happen at all. -->
      <dd><SText type="cell" class="value value--lead">{{ facts.wiring }}</SText></dd>

      <dt><SText type="cell-meta" color="fg-2-soft">{{ INTERNET_KEY }}</SText></dt>
      <dd><SText type="cell" class="value">{{ facts.internet }}</SText></dd>

      <dt><SText type="cell-meta" color="fg-2-soft">{{ ACCESS_KEY }}</SText></dt>
      <dd><SText type="cell" class="value">{{ facts.access }}</SText></dd>
    </dl>
  </section>
</template>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block--phone {
  padding: 14px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.block--desk {
  gap: 12px;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.block--desk .head {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-line);
}

/* A definition list, because that is what it is: three keys and what each one
   says about this house. The grid is what makes the keys a column. */
.facts {
  display: grid;
  margin: 0;
}

.block--phone .facts {
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 6px 10px;
}

.block--desk .facts {
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 10px 12px;
}

/* The key and the value are the grid's items, not boxes holding them: a block
   between the grid and its text contributes a strut of the *page's* size, and
   a one-line answer would then stand two lines high. `display: contents` keeps
   the list semantics for a screen reader and takes the box away. */
dt,
dd {
  display: contents;
  margin: 0;
}

/* The key is mono at 11px and the value sans at 14px, so their first lines do
   not sit on one baseline on their own. */
dt > :deep(.s-text) {
  padding-top: 2px;
}

dd > :deep(.s-text) {
  min-width: 0;
}

.value {
  text-wrap: pretty;
}

.block--phone .value {
  line-height: 1.45;
}

.block--desk .value {
  line-height: 1.5;
}

.value--lead {
  font-weight: 500;
}

.link {
  text-decoration: none;
  border-radius: var(--radius-flag);
}

.link:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
</style>
