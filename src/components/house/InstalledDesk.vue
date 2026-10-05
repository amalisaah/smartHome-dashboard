<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import InstalledBeforeYouTouch from '@/components/house/InstalledBeforeYouTouch.vue'
import InstalledDeskRoom from '@/components/house/InstalledDeskRoom.vue'
import {
  activeCount,
  CORRECT_BY_HAND,
  DONE,
  EXPLAINER_AFTER,
  EXPLAINER_BEFORE,
  EXPLAINER_TAG,
  faultyCount,
  INSTALLED_FOOTER_LEGEND,
  removedToggle,
} from '@/data/installedCopy'
import type {
  BeforeYouTouch,
  CountField,
  InstalledRoom,
  InstalledTotals,
} from '@/types/installed'

/**
 * C3 — the whole house as one table, read like a stock sheet.
 *
 * **One table, two modes, and that is the design.** `Correct by hand` does not
 * open a screen or a dialog: the three count columns become steppers where they
 * stand, the removed rows come up, and each room grows a catalogue search. The
 * row being corrected never moves, so the eye that found it does not have to
 * find it again.
 *
 * **`Done` only leaves the mode.** There is no save button here or anywhere in
 * this module — a count is kept as it is stepped, each change flips its own row
 * to `by hand`, and the app bar is where saving is reported.
 */
defineProps<{
  customerId: number
  houseId: number
  rooms: readonly InstalledRoom[]
  totals: InstalledTotals
  facts: BeforeYouTouch
  showRemoved: boolean
  correcting: boolean
}>()

defineEmits<{
  toggleRemoved: []
  correct: []
  done: []
  step: [deviceId: number, field: CountField, by: number]
}>()
</script>

<template>
  <div class="body">
    <div class="main">
      <div class="toolbar">
        <SText type="list-meta" color="fg-2">
          {{ activeCount(totals.active) }} ·
          <span class="faulty">{{ faultyCount(totals.faulty) }}</span>
        </SText>

        <div class="actions">
          <button
            v-if="totals.removed > 0"
            type="button"
            class="toggle"
            @click="$emit('toggleRemoved')"
          >
            {{ removedToggle(showRemoved, totals.removed) }}
          </button>

          <!-- `toolbar` and `chrome`+`sm` are the frame's two doors: the mode's
               primary at the display face it is drawn at, and the quiet one
               resting on `--surface` as a toolbar's secondary does. -->
          <SButton v-if="correcting" size="row" @click="$emit('done')">
            {{ DONE }}
          </SButton>
          <SButton v-else variant="chrome" size="sm" @click="$emit('correct')">
            {{ CORRECT_BY_HAND }}
          </SButton>
        </div>
      </div>

      <!-- It appears with the mode and goes with it: what it explains is what
           the steppers below are about to write into the record. -->
      <p v-if="correcting" class="explainer">
        {{ EXPLAINER_BEFORE }} <span class="tag">{{ EXPLAINER_TAG }}</span>
        {{ EXPLAINER_AFTER }}
      </p>

      <div class="table">
        <div class="head">
          <SText type="column-header" color="micro">Room · device</SText>
          <SText type="column-header" color="micro" class="centred">Active</SText>
          <SText type="column-header" color="risk" class="centred">Faulty</SText>
          <SText type="column-header" color="micro" class="centred">Removed</SText>
          <SText type="column-header" color="micro">Written by</SText>
        </div>

        <InstalledDeskRoom
          v-for="room in rooms"
          :key="room.id"
          :room="room"
          :show-removed="showRemoved"
          :correcting="correcting"
          @step="(deviceId, field, by) => $emit('step', deviceId, field, by)"
        />
      </div>

      <SText type="cell-meta" color="fg-2-soft" class="footer">
        {{ INSTALLED_FOOTER_LEGEND }}
      </SText>
    </div>

    <div class="aside">
      <InstalledBeforeYouTouch
        :facts="facts"
        :customer-id="customerId"
        :house-id="houseId"
        size="desk"
      />
    </div>
  </div>
</template>

<style scoped>
.body {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  align-items: start;
  gap: 32px;
  padding: 24px 32px 32px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* The one amber figure in the strip, weighted because it is the half of the
   sentence somebody is going to act on. */
.faulty {
  color: var(--color-risk);
  font-weight: 600;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-action-ink);
  background: transparent;
  border: none;
  border-radius: var(--radius-flag);
  padding: 6px 4px;
  cursor: pointer;
}

.toggle:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.toggle:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

.explainer {
  margin: 0;
  padding: 10px 14px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-fg-2);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
}

/* The chip as it will appear on the record, drawn inside the sentence that
   explains it — so the thing being described is the thing being shown. */
.tag {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-flag);
  background: var(--color-bg);
  white-space: nowrap;
}

.table {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* The same five tracks every row under it uses. */
.head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px 120px 120px 150px;
  gap: 16px;
  align-items: center;
  padding: 0 12px 8px;
  border-bottom: 1px solid var(--color-line);
}

.centred {
  text-align: center;
}

.footer {
  padding-left: 12px;
}

.aside {
  min-width: 0;
}

/*
 * ⚠️ Not designed. Below the width the table's four fixed columns and its aside
 * both need, the aside drops underneath — the count columns are what make the
 * table a stock sheet, and squeezing them is what the layout exists to avoid.
 */
@media (max-width: 1240px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
}
</style>
