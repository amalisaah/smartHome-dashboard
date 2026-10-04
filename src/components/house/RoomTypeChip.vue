<script setup lang="ts">
import { computed } from 'vue'
import { SBadge } from '@/components/atoms'
import { UNTYPED_ROOM } from '@/data/houseVisitCopy'
import { roomTypeState, type VisitRoom } from '@/types/houseVisit'

/**
 * A room's type, and the one click that settles it.
 *
 * The three states are the system's visual language, not three colours:
 *
 *   **solid** — he set it. `bedroom`.
 *   **dashed** — the system guessed it from the name, and is saying so.
 *                `kitchen ?`. The dashes go the moment he clicks.
 *   **risk** — there is no type, and a room with no type is a blank that costs
 *              something later. `type?`.
 *
 * A click confirms a guess, advances a confirmed type, and gives a blank the
 * first one — the same interaction as block B, so a type learned here is a type
 * learned there. Everything *else* about rooms stays in B: renaming, adding,
 * removing, reordering.
 */
const props = defineProps<{ room: VisitRoom }>()

defineEmits<{ cycle: [] }>()

const state = computed(() => roomTypeState(props.room))

const VARIANT = {
  confirmed: 'category-mid',
  guessed: 'dormant',
  missing: 'incomplete',
} as const

/** The `?` is part of what a guess says, so it is drawn with the word. */
const label = computed(() => {
  if (props.room.type === null) return UNTYPED_ROOM
  return props.room.guessed ? `${props.room.type} ?` : props.room.type
})

/** Said to a screen reader, where a dashed border says nothing at all. */
const described = computed(() =>
  state.value === 'guessed'
    ? `Type guessed as ${props.room.type}. Click to confirm.`
    : state.value === 'missing'
      ? `${props.room.name} has no type. Click to set one.`
      : `${props.room.name} is a ${props.room.type}. Click to change.`,
)
</script>

<template>
  <button
    type="button"
    class="chip"
    :class="`chip--${state}`"
    :aria-label="described"
    @click="$emit('cycle')"
  >
    <SBadge :variant="VARIANT[state]" size="status">{{ label }}</SBadge>
  </button>
</template>

<style scoped>
/* The badge is the drawn box; the button is only what makes it clickable, so it
   contributes no padding, no border and no ground of its own. */
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
.chip--confirmed:hover :deep(.s-badge) {
  border-color: var(--color-fg-3);
}

.chip--guessed:hover :deep(.s-badge) {
  background: var(--color-surface);
}

.chip:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
</style>
