<script setup lang="ts">
import { computed } from 'vue'
import { SBadge, SText } from '@/components/atoms'
import { STATUS_BADGE, type CustomerRow } from '@/types/customers'
import { splitOnMatch } from '@/utils/format'

const props = defineProps<{
  row: CustomerRow
  query: string
}>()

defineEmits<{ open: [] }>()

const nameParts = computed(() => splitOnMatch(props.row.name, props.query))

/**
 * The second line answers one question — is her house started? Never an address:
 * he is at her gate and already knows where he is.
 */
const metaLine = computed(() =>
  props.row.roomCount === null
    ? `${props.row.phone} · no house yet`
    : `${props.row.phone} · house · ${props.row.roomCount} rooms`,
)

const metaParts = computed(() => splitOnMatch(metaLine.value, props.query))
</script>

<template>
  <button type="button" class="row" @click="$emit('open')">
    <span class="left">
      <SText type="row-name">
        <template v-for="(part, index) in nameParts" :key="index">
          <mark v-if="part.match" class="match">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </SText>
      <SText type="list-meta" class="meta">
        <template v-for="(part, index) in metaParts" :key="index">
          <mark v-if="part.match" class="match">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </SText>
    </span>

    <SBadge :variant="STATUS_BADGE[row.status]" size="status" class="chip">
      {{ row.status }}
    </SBadge>

    <!-- An icon that happens to be a character. -->
    <span class="chevron" aria-hidden="true">›</span>
  </button>
</template>

<style scoped>
/* The whole row is the button: nothing competes with it, and there is no chevron
   to aim at — tapping anywhere opens her house. The last row keeps its divider,
   as the reference draws it. */
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  min-height: 66px;
  border: none;
  border-bottom: 1px solid var(--color-divider);
  background: var(--color-bg);
  text-align: left;
  cursor: pointer;
  font: inherit;
  transition: background-color 120ms ease-out;
}

.row:hover {
  background: var(--color-row-hover);
}

/* Pressed, not hovered: on this device only the press happens. */
.row:active {
  background: var(--color-surface);
}

.row:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

/* A long name truncates rather than pushing the chip off the row. */
.meta,
.left :deep(.s-text) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip,
.chevron {
  flex: none;
}

.chevron {
  font-size: 18px;
  line-height: 1;
  color: var(--color-fg-3);
}

.match {
  background: var(--color-match-highlight);
  color: inherit;
  border-radius: 3px;
}
</style>
