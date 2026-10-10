<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { SText } from '@/components/atoms'
import { OFFLINE_STATUS } from '@/data/houseVisitCopy'
import type { HeaderStatus } from '@/types/house'

/**
 * The house's phone header, on all three of its tabs. Three things and no
 * more: the way back to her, where the record has got to, and what he is
 * looking at.
 *
 * The title is **"Her house", never the address.** Someone who glances at the
 * phone on a table sees a name and not a location, and the address is a field
 * further down the screen rather than the thing the screen is called.
 *
 * There is no save button here or anywhere on these screens. The status is
 * reported, never asked for — a dot and a time, or the no-signal line, or what
 * the tab in front of him has to say about its own record. Never progress.
 */
defineProps<{
  customerName: string
  backTo: RouteLocationRaw
  /** `saved · 14:02`. Null until he has changed something. */
  savedLabel: string | null
  offline: boolean
  /** What this tab says instead. Wins over `savedLabel` and the offline line. */
  status?: HeaderStatus | null
}>()
</script>

<template>
  <div class="header">
    <div class="row">
      <RouterLink :to="backTo" class="back">
        <SText type="cell" color="muted-dark">‹ {{ customerName }}</SText>
      </RouterLink>

      <!-- A tab that has its own thing to say says it. The two below are Visit
           notes', which is the tab that has words being typed into it. -->
      <span v-if="status" class="status" role="status" aria-live="polite">
        <span
          v-if="status.dot"
          class="dot"
          :class="`dot--${status.tone}`"
          aria-hidden="true"
        />
        <SText
          type="cell-meta"
          :color="status.tone === 'risk' ? 'risk-on-dark' : 'muted-dark'"
        >
          {{ status.label }}
        </SText>
      </span>

      <!-- Offline outranks a save time, because it explains it: the words are
           still kept, they are just kept here for now. -->
      <span v-else-if="offline" class="status" role="status" aria-live="polite">
        <span class="dot dot--risk" aria-hidden="true" />
        <SText type="cell-meta" color="risk-on-dark">{{ OFFLINE_STATUS }}</SText>
      </span>
      <span v-else-if="savedLabel" class="status" role="status" aria-live="polite">
        <span class="dot dot--action" aria-hidden="true" />
        <SText type="cell-meta" color="muted-dark">{{ savedLabel }}</SText>
      </span>
    </div>

    <SText type="title" as="h1" color="inverse">Her house</SText>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: var(--color-fg);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Flex, so the box is the height of its own 14px line rather than the header's
   strut — and the thumb target is hung off it instead of growing it. */
.back {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  text-decoration: none;
}

.back::after {
  content: '';
  position: absolute;
  inset: 50% auto auto 0;
  right: 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}

.back :deep(.s-text) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.back:hover :deep(.s-text) {
  color: var(--color-inverse);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* The drawn action is lost against `--fg`, so the ring is the lifted one. */
.back:focus-visible {
  outline: 2px solid var(--color-action-on-dark);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.dot {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: var(--radius-pill);
}

.dot--action {
  background: var(--color-action-on-dark);
}

.dot--risk {
  background: var(--color-risk-on-dark);
}
</style>
