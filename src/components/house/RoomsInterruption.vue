<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * B2 — what the screen says after something interrupted him.
 *
 * Two of them, and the difference is the dot:
 *
 *   **resume** (action) — he took a call and came back. It is an
 *   acknowledgement, not a warning: the half-typed name is still in the box and
 *   the keyboard is up, and the card exists to say so before he wonders.
 *
 *   **untyped** (risk) — rooms that still say `type?`. It names them, says they
 *   are saved, and offers tonight's laptop as an alternative. **It never blocks
 *   him**: there is no button on it, nothing goes amber in the list because of
 *   it, and the field below stays exactly as live as it was.
 *
 * The third card in the handoff — "Same name twice" — is a spec card describing
 * behaviour rather than a thing that is drawn, so it is implemented in
 * `uniqueRoomName` and not rendered.
 */
defineProps<{ tone: 'resume' | 'untyped'; title: string; detail: string }>()
</script>

<template>
  <div class="card" :class="`card--${tone}`" role="status" aria-live="polite">
    <span class="dot" aria-hidden="true" />
    <span class="body">
      <SText type="list-title">{{ title }}</SText>
      <SText type="meta">{{ detail }}</SText>
    </span>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-line);
  background: var(--color-bg);
}

/* Amber, and the only thing on this tab that is: a room with no type is a blank
   that costs something later. It tints rather than shouts — the card is a note
   about work already saved, not a problem to stop for. */
.card--untyped {
  background: var(--color-row-risk-tint);
  border-color: var(--color-risk);
}

.dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: var(--radius-pill);
  background: var(--color-action);
}

.card--untyped .dot {
  background: var(--color-risk);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
</style>
