<script setup lang="ts">
import { computed } from 'vue'
import { SBadge, SBanner, SButton, SText } from '@/components/atoms'
import { houseAside } from '@/data/customerRemovalCopy'
import type { HouseListItem } from '@/types/customerDetail'

/**
 * Her houses — one row each, in the order the endpoint answered. A list rather
 * than the handoff's single card because the endpoint is plural, and the count
 * is the first thing to read.
 *
 * **No address, area, landmark or GPS, at any width.** Those arrive on the same
 * request and are dropped at the mapper, so this component is never handed them.
 */
const props = defineProps<{
  houses: HouseListItem[]
  /** Nothing read yet. A revalidation never empties the list already up. */
  loading?: boolean
  /** The read came back other than 2xx. Said here, not as a page banner. */
  failed?: boolean
}>()

defineEmits<{ open: [houseId: number]; add: [] }>()

/** One house needs no count; several do, and the label says which it is. */
const label = computed(() =>
  props.houses.length > 1 ? `Her houses · ${props.houses.length}` : 'Her house',
)

/** The same act either way; only the word changes. */
const addLabel = computed(() =>
  props.houses.length === 0 ? 'Start her house' : 'Add another house',
)

/** Without a count the button cannot say which of the two things it does. */
const canAdd = computed(() => !props.loading && !props.failed)

const SKELETON_ROWS = 2
</script>

<template>
  <div class="column">
    <SText type="micro" color="micro" as="h2">{{ label }}</SText>

    <SBanner v-if="failed" variant="error">Could not read her houses.</SBanner>

    <div v-else class="card">
      <!-- Surface blocks at the row height, so nothing jumps when they land. -->
      <template v-if="loading">
        <div
          v-for="index in SKELETON_ROWS"
          :key="index"
          class="row row--inert"
          aria-hidden="true"
        >
          <span class="bar" />
        </div>
      </template>

      <div v-else-if="houses.length === 0" class="row row--inert">
        <SText type="ui" color="fg-2">No house yet</SText>
      </div>

      <template v-else>
        <button
          v-for="house in houses"
          :key="house.id"
          type="button"
          class="row"
          @click="$emit('open', house.id)"
        >
          <SText type="ui" class="name">{{ house.name }}</SText>
          <SBadge v-if="house.condition" variant="category-outlined" size="status">
            {{ house.condition }}
          </SBadge>
        </button>
      </template>

      <div v-if="canAdd" class="foot">
        <SButton variant="secondary" size="sm" @click="$emit('add')">{{ addLabel }}</SButton>
      </div>
    </div>

    <SText type="caption" class="aside">{{ houseAside }}</SText>
  </div>
</template>

<style scoped>
.column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  /* Rounds the first and last rows against the border. */
  overflow: hidden;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid var(--color-divider);
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
  /* Colour only — nothing on this screen animates position or size. */
  transition: background-color 120ms ease-out;
}

/* A row's divider is also the rule above the footer, so it is only dropped when
   the row really is the last thing in the card. */
.row:last-child {
  border-bottom: none;
}

.row:hover:not(.row--inert) {
  background: var(--color-row-hover);
}

.row:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

/* A row that states something rather than leading somewhere. */
.row--inert {
  cursor: default;
}

.name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The card's own action, on the strip every other footer in this app uses. */
.foot {
  display: flex;
  padding: 12px 16px;
  background: var(--color-surface);
}

.bar {
  display: block;
  width: 56%;
  height: 14px;
  background: var(--color-surface);
  border-radius: var(--radius-flag);
}

.aside {
  line-height: 1.6;
}

/* ⚠️ Not designed. The rows already stand at the phone door; the footer's
   button is the one thing here drawn below it. */
@media (max-width: 899px) {
  .foot :deep(.s-btn) {
    min-height: var(--hit-min);
  }
}
</style>
