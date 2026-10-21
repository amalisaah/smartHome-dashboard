<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { SBadge, SText } from '@/components/atoms'
import {
  quoteRowActionHint,
  quoteRowDestination,
  quoteRowSubtitle,
  type QuoteListRow,
} from '@/types/quoteList'

/**
 * One quote, as both devices render it. Only the container differs — the phone
 * lays these in a flat list, the laptop puts each in a card — so the content
 * lives here once.
 *
 * **The whole row is the hit target, and there are no buttons inside it.** The
 * blue line at the foot of a sent row is a label saying where the tap goes, not
 * a second thing to press: a row with two targets makes him aim, and he is
 * reading this one-handed.
 *
 * **Days waiting never changes colour.** It is the largest thing on a sent row
 * because chasing is why he opened the screen, but there is no cut-off at which
 * the app calls a quote late. Some customers take three weeks and are fine.
 * When to chase is his call, and an amber row would be the app making it.
 */
const props = defineProps<{
  row: QuoteListRow
  /** The phone's flat row, or the laptop's card. */
  device: 'phone' | 'desk'
}>()

const phone = computed(() => props.device === 'phone')

const destination = computed(() => quoteRowDestination(props.row))
const subtitle = computed(() => quoteRowSubtitle(props.row))
const actionHint = computed(() => quoteRowActionHint(props.row))

/** `1 day waiting`, and `19 days waiting`. */
const daysLabel = computed(() => (props.row.daysWaiting === 1 ? 'day waiting' : 'days waiting'))

const chip = computed(() => {
  if (props.row.status === 'accepted') return `accepted ${props.row.answeredOn}`
  if (props.row.status === 'declined') return `declined ${props.row.answeredOn}`
  return null
})

/**
 * The name the row exists to be found by. It is one string rather than two
 * elements, so a long area wraps under the surname instead of breaking the
 * em dash onto a line of its own.
 */
const name = computed(() => `${props.row.surname} — ${props.row.area}`)
</script>

<template>
  <RouterLink :to="destination" class="row" :class="`row--${device}`">
    <span class="left">
      <SText :type="phone ? 'row-name' : 'list-title'">{{ name }}</SText>
      <SText type="cell-meta" color="fg-2">{{ subtitle }}</SText>

      <!-- Only when he wrote one down. An empty reason shows nothing — not a
           dash, which would read as a reason he recorded. -->
      <SText v-if="row.declinedReason" type="row-meta" class="reason">
        “{{ row.declinedReason }}”
      </SText>

      <SText v-if="actionHint" type="tab" color="action" class="act">{{ actionHint }}</SText>
    </span>

    <span class="right">
      <template v-if="row.status === 'sent'">
        <SText :type="phone ? 'figure' : 'total'" class="days">{{ row.daysWaiting }}</SText>
        <SText type="column-header" color="fg-2">{{ daysLabel }}</SText>
      </template>

      <SText v-else-if="row.status === 'draft'" type="list-meta" color="fg-2">
        {{ row.editedText }}
      </SText>

      <SBadge
        v-else
        :variant="row.status === 'accepted' ? 'outcome-accepted' : 'outcome-declined'"
        size="inline"
      >
        {{ chip }}
      </SBadge>
    </span>
  </RouterLink>
</template>

<style scoped>
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  color: inherit;
  text-decoration: none;
  transition: background-color 120ms ease-out, border-color 120ms ease-out;
}

.row:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

/* The phone's flat list. A row is at least a 64px door whatever it holds, so a
   draft with one meta line is as easy to hit as a sent one with four. */
.row--phone {
  min-height: 64px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--color-divider);
}

/* There is no cursor on a phone — the finger is on top of the row — so the
   press answers by filling the whole thing. */
.row--phone:active {
  background: var(--color-surface);
}

/* The laptop's card. It answers a reach with the action border rather than a
   fill: a column of cards on `--surface` needs to say which one is under the
   cursor, and a fill would make the card's own ground ambiguous. */
.row--desk {
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.row--desk:hover {
  border-color: var(--color-action);
}

/* `min-width: 0` so a long household name shrinks the name column rather than
   pushing the days figure out of the row. */
.left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex: none;
}

.reason {
  font-style: italic;
}

/* Set off from the facts above it by a hair: it is the one line that says what
   happens next rather than what is true now. */
.act {
  padding-top: 2px;
}

/* The figure sits on its own baseline, so the label tucks under it rather than
   under the line box a 24px font would otherwise claim. */
.days {
  line-height: 1;
}
</style>
