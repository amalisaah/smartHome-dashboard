<script setup lang="ts">
import { SText } from '@/components/atoms'
import {
  BACK_ONLINE,
  OFFLINE_TITLE,
  WAITING_TO_SEND,
  offlineReassurance,
} from '@/data/houseVisitCopy'
import type { HeldItem } from '@/types/houseVisit'

/**
 * A2 — no signal, mid-visit.
 *
 * **Nothing here blocks anything.** Every field below stays live, every button
 * still works, and what he types shows the instant he types it. This band is a
 * reassurance, not a gate: it exists because a man standing in someone's
 * compound watching a phone lose signal will stop typing unless told not to,
 * and stopping is the only way this screen can actually lose a visit.
 *
 * So the copy is about what is already safe rather than about the failure, and
 * the list under it names what is held and since when — the facts that answer
 * "will I have to do this again?". All of it is supplied; nothing is counted
 * here.
 *
 * `reconnected` replaces the band with its own ending. The header has already
 * gone back to the save time by then; this is the acknowledgement that the held
 * things went.
 */
defineProps<{
  /** `4 notes and 6 rooms are on this phone.` */
  noteCount: number
  roomCount: number
  held: HeldItem[]
  /** Signal is back and the queue has drained. */
  reconnected?: boolean
  /** `14:09` — when it went. */
  sentAt?: string
}>()
</script>

<template>
  <div v-if="reconnected" class="sent" role="status" aria-live="polite">
    <span class="dot dot--action" aria-hidden="true" />
    <SText type="cell" class="sent-line">{{ BACK_ONLINE }}</SText>
    <SText v-if="sentAt" type="cell-meta">{{ sentAt }}</SText>
  </div>

  <template v-else>
    <div class="banner" role="status" aria-live="polite">
      <span class="dot dot--risk" aria-hidden="true" />
      <div class="says">
        <SText type="list-title">{{ OFFLINE_TITLE }}</SText>
        <SText type="meta">{{ offlineReassurance(noteCount, roomCount) }}</SText>
      </div>
    </div>

    <div v-if="held.length" class="queue">
      <SText type="micro" color="micro" as="h2">{{ WAITING_TO_SEND }}</SText>
      <div v-for="item in held" :key="item.id" class="row">
        <SText type="cell">{{ item.label }}</SText>
        <SText type="list-meta">{{ item.at }}</SText>
      </div>
    </div>
  </template>
</template>

<style scoped>
/* A band across the frame, not a card inset in it: the condition holds over
   everything below, and a card would read as one more thing on the screen. */
.banner {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-row-risk-tint);
  border-bottom: 1px solid var(--color-risk);
}

.says {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: var(--radius-pill);
}

/* Aligned to the 15px line it sits beside, rather than to the top of the box. */
.banner .dot {
  margin-top: 6px;
}

.dot--risk {
  background: var(--color-risk);
}

.dot--action {
  background: var(--color-action);
}

.queue {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-divider);
}

/* The last row's rule would be a line under a list with nothing after it. */
.row:last-child {
  border-bottom: none;
}

.sent {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.sent-line {
  flex: 1;
  min-width: 0;
}
</style>
