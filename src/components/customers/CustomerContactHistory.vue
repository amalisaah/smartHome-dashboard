<script setup lang="ts">
import { SBadge, SBanner, SText } from '@/components/atoms'
import type { ContactHistoryEntry } from '@/types/customerDetail'

/**
 * One list, newest first, in the order the contact log answered with. Status
 * changes sit inside it as dashed events rather than in a log of their own, so
 * "why is she a customer" is answered where it happened.
 *
 * Read-only, all of it. There is no edit and no delete on a history row: an
 * entry is a record of something that was said, and the way to correct one is to
 * say something else.
 *
 * It carries its own two failures because it is its own request: losing the
 * history costs the list and nothing else on the screen.
 */
defineProps<{
  entries: ContactHistoryEntry[]
  /** Nothing read yet. A revalidation never empties the list already up. */
  loading?: boolean
  /** The read came back other than 2xx. Said here, not as a page banner. */
  failed?: boolean
}>()

/** Enough rows to read as a list rather than as one missing thing. */
const SKELETON_ROWS = 4
</script>

<template>
  <section class="history">
    <div class="head">
      <SText type="micro" color="micro" as="h2">Contact history</SText>
      <!-- Says the convention out loud, because the chips mean something. -->
      <SText type="cell-meta">status changes dashed</SText>
    </div>

    <!-- Surface blocks on the entry grid, so the list does not jump when it lands. -->
    <div v-if="loading" aria-hidden="true">
      <div v-for="index in SKELETON_ROWS" :key="index" class="entry">
        <span class="bar bar--date" />
        <span class="bar bar--line" />
      </div>
    </div>

    <SBanner v-else-if="failed" variant="error" class="failure">
      Could not read her contact history.
    </SBanner>

    <SText v-else-if="entries.length === 0" type="cell" color="fg-2" class="empty">
      — nothing recorded yet —
    </SText>

    <template v-else>
      <div
        v-for="(entry, index) in entries"
        :key="entry.id"
        class="entry"
        :class="{ 'entry--last': index === entries.length - 1 }"
      >
        <SText type="list-meta">{{ entry.date }}</SText>

        <SText v-if="entry.kind === 'note'" type="cell">{{ entry.text }}</SText>

        <SText v-else-if="entry.kind === 'no-note'" type="cell" color="fg-2">
          — no note —
        </SText>

        <!-- Dashed: the system set this, and no click of his can. -->
        <span v-else class="change">
          <SBadge variant="draft" size="inline">{{ entry.from }} → {{ entry.to }}</SBadge>
          <SText v-if="entry.caption" type="cell" color="fg-2">{{ entry.caption }}</SText>
        </span>
      </div>
    </template>
  </section>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-line);
}

.entry {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-divider);
}

/* The last entry closes the list rather than ruling under it. */
.entry--last {
  border-bottom: none;
}

/* A chip sets the line's height, so the date beside it is centred against the
   chip and not against where the text would have been. */
.entry:has(.change) {
  align-items: center;
}

.change {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* The skeleton stands on the entry grid at the heights the real rows take. */
.bar {
  display: block;
  height: 14px;
  background: var(--color-surface);
  border-radius: var(--radius-flag);
}

.bar--date {
  width: 48px;
  height: 12px;
}

.bar--line {
  width: 68%;
}

/* A read that failed and a list with nothing in it both sit where the first
   entry would, so the section keeps its shape either way. */
.failure,
.empty {
  margin-top: 12px;
}
</style>
