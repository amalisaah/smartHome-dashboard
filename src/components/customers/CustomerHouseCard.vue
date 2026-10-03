<script setup lang="ts">
import { SBadge, SText } from '@/components/atoms'
import { houseAside } from '@/data/customerRemovalCopy'
import type { HouseState } from '@/types/customerDetail'

/**
 * Her house, in counts.
 *
 * There is no address, no area, no landmark and no price on this card at any
 * width — anyone reading over his shoulder sees "6 rooms", not where she lives.
 * The things that would say where she is live inside the house, which is a
 * different screen and says so underneath.
 */
defineProps<{ house: HouseState }>()

defineEmits<{ open: []; start: [] }>()
</script>

<template>
  <div class="column">
    <div class="card">
      <SText type="micro" color="micro" as="h2">Her house</SText>

      <template v-if="house">
        <SText type="screen-title">{{ house.rooms }} rooms · {{ house.devices }} devices</SText>

        <!-- The one amber on this screen that is not delete. Supplied; omitted
             entirely when nothing is faulty. -->
        <SText v-if="house.faultCount !== null" type="row-meta" as="p">
          <span class="fault">{{ house.faultCount }} faulty</span>
          <template v-if="house.faultCaption"> — {{ house.faultCaption }}</template>
        </SText>

        <div v-if="house.conditions.length" class="tags">
          <SBadge
            v-for="condition in house.conditions"
            :key="condition"
            variant="category-outlined"
            size="status"
          >
            {{ condition }}
          </SBadge>
        </div>

        <button type="button" class="link" @click="$emit('open')">
          <SText type="ui" color="action-ink">Open the house</SText>
        </button>
      </template>

      <!-- Not drawn in the handoff, so it keeps the card's metrics exactly and
           puts the offer where the counts were. -->
      <template v-else>
        <SText type="screen-title">No house yet</SText>
        <button type="button" class="link" @click="$emit('start')">
          <SText type="ui" color="action-ink">Start her house</SText>
        </button>
      </template>
    </div>

    <SText type="caption" class="aside">{{ houseAside }}</SText>
  </div>
</template>

<style scoped>
.column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 20px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.fault {
  color: var(--color-risk);
  font-weight: 600;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* A word that goes somewhere, with no box of its own. Underlined on the reach,
   not at rest — the card is read, and only then acted on. */
.link {
  /* As tall as its own text, not as the document's line box. */
  display: inline-flex;
  align-items: center;
  padding: 0;
  background: none;
  border: none;
  border-radius: var(--radius-flag);
  cursor: pointer;
  font: inherit;
  transition: color 120ms ease-out;
}

.link:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

.aside {
  line-height: 1.6;
}

/* ⚠️ Not designed. The link keeps its drawn size and gains a phone target. */
@media (max-width: 899px) {
  .link {
    position: relative;
  }

  .link::after {
    content: '';
    position: absolute;
    inset: 50% auto auto 50%;
    width: 100%;
    min-width: var(--hit-min);
    height: var(--hit-min);
    transform: translate(-50%, -50%);
  }
}
</style>
