<script setup lang="ts">
import { computed } from 'vue'
import { SBadge } from '@/components/atoms'
import { UNTYPED_ROOM } from '@/data/houseVisitCopy'
import { roomTypeState, spaceLabel, type VisitRoom } from '@/types/houseVisit'

/**
 * A room's type, and the one tap that settles it.
 *
 * The three states are the system's visual language, not three colours:
 *
 *   **solid** — he set it. `bedroom`.
 *   **dashed** — the system guessed it from the name, and is saying so.
 *                `kitchen ?`. The dashes go the moment he taps.
 *   **risk** — there is no type, and a room with no type is a blank that costs
 *              something later. `type?`.
 *
 * A tap confirms a guess, advances a confirmed type, and gives a blank the
 * first one — the same interaction on the Visit notes card and in block B's
 * phone list, so a type learned in one place is a type learned in both.
 *
 * Two doors, because it is tapped on two devices. `card` is the chip beside a
 * room in a panel, where it sits in a line of 11px labels. `row` is the phone's
 * list, where it is a 36px thing a thumb has to land on and the label grows to
 * 12px to match. The `row` door draws its own box rather than wearing a badge:
 * at 36px with a tap target under it, this stopped being a badge and became a
 * control, and dressing a button up as a badge to borrow three border colours
 * would hide that.
 */
const props = withDefaults(defineProps<{ room: VisitRoom; size?: 'card' | 'row' }>(), {
  size: 'card',
})

defineEmits<{ cycle: [] }>()

const state = computed(() => roomTypeState(props.room))

const VARIANT = {
  confirmed: 'category-mid',
  guessed: 'dormant',
  missing: 'incomplete',
} as const

/** `living_room` is two words to everyone but the database. */
const word = computed(() => (props.room.type === null ? null : spaceLabel(props.room.type)))

/** The `?` is part of what a guess says, so it is drawn with the word. */
const label = computed(() => {
  if (word.value === null) return UNTYPED_ROOM
  return props.room.guessed ? `${word.value} ?` : word.value
})

/** Said to a screen reader, where a dashed border says nothing at all. */
const described = computed(() =>
  state.value === 'guessed'
    ? `Type guessed as ${word.value}. Click to confirm.`
    : state.value === 'missing'
      ? `${props.room.name} has no type. Click to set one.`
      : `${props.room.name} is a ${word.value}. Click to change.`,
)
</script>

<template>
  <button
    type="button"
    class="chip"
    :class="[`chip--${state}`, `chip--${size}`]"
    :aria-label="described"
    @click="$emit('cycle')"
  >
    <SBadge v-if="size === 'card'" :variant="VARIANT[state]" size="status">{{ label }}</SBadge>
    <template v-else>{{ label }}</template>
  </button>
</template>

<style scoped>
/* On the `card` door the badge is the drawn box and the button is only what
   makes it clickable, so it contributes no padding, no border and no ground. */
.chip {
  display: inline-flex;
  padding: 0;
  background: none;
  border: none;
  border-radius: var(--radius-chip);
  cursor: pointer;
  font: inherit;
}

.chip :deep(.s-badge) {
  transition: border-color 120ms ease-out, background-color 120ms ease-out;
}

/* Reaching for it firms the border, as reaching for a field does. Not on the
   untyped one: its border is the warning, and a hover must not take that off. */
.chip--card.chip--confirmed:hover :deep(.s-badge) {
  border-color: var(--color-fg-3);
}

.chip--card.chip--guessed:hover :deep(.s-badge) {
  background: var(--color-surface);
}

.chip:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

/* === the phone's list row === */
.chip--row {
  position: relative;
  align-items: center;
  flex: none;
  padding: 0 10px;
  min-height: 36px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
  white-space: nowrap;
  border: 1px solid transparent;
  transition: border-color 120ms ease-out, background-color 120ms ease-out;
}

.chip--row.chip--confirmed {
  border-color: var(--color-line);
  background: var(--color-surface);
  color: var(--color-fg-2);
}

.chip--row.chip--guessed {
  border-style: dashed;
  border-color: var(--color-fg-3);
  background: var(--color-bg);
  color: var(--color-fg-2);
}

.chip--row.chip--missing {
  border-color: var(--color-risk);
  background: var(--color-bg);
  color: var(--color-risk);
}


/* The drawn box is 36px and a thumb needs 48. The box keeps the height it is
   drawn at and the target is hung off it, rather than the control growing to
   hold it — the same answer the house's tab bar and header link give. */
.chip--row::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}

/* The press has to read with a thumb on top of the chip, so the answer is the
   whole box filling rather than anything at its edge. */
.chip--row:active {
  background: var(--color-surface);
}
</style>
