<script setup lang="ts">
import { ROOM_TYPES } from '@/types/houseRooms'
import { spaceLabel } from '@/types/houseVisit'
import type { ApiSpaceSlug } from '@/types/api'

/**
 * All six types at once, with one of them answered.
 *
 * The counterpart to `RoomTypeChip`, which shows the one type a room has. This
 * shows the six it could have, and it is used wherever the width is there to
 * put them: the phone's entry dock, for the room being typed, and every row of
 * the laptop's table.
 *
 * Same three-way language, read as a set rather than as one chip:
 *
 *   **solid fill** — this is the type, and he picked it.
 *   **dashed outline** — this is the type the system guessed, and it is saying
 *                        so. ` · guess` on the phone, where there is room for
 *                        the word; ` ?` at the desk, where there is not.
 *   **quiet outline** — one of the five he has not chosen.
 *
 * On the phone a tap picks, and tapping the picked one again unpicks it back to
 * the guess. At the desk one click sets the type **and confirms it** — there is
 * no cycling, because all six are already on screen and cycling is what you do
 * when they are not.
 */
withDefaults(
  defineProps<{
    /** The type in force, his or the system's. */
    modelValue: ApiSpaceSlug | null
    /** Whether that type is the system's word rather than his. */
    guessed?: boolean
    /**
     * `draft` is the phone's dock — 40px, mono 12, and the guess says the word
     * `guess` out loud. `grid` is a laptop row, where six chips share 470px.
     */
    size?: 'draft' | 'grid'
    /** Names the set to a screen reader — `Type for Master`. */
    ariaLabel?: string
  }>(),
  { size: 'draft', guessed: false },
)

defineEmits<{ 'update:modelValue': [type: ApiSpaceSlug] }>()
</script>

<template>
  <!-- A group rather than a list: six controls that answer one question, which
       is what lets a screen reader say the question once. -->
  <div class="choice" :class="`choice--${size}`" role="group" :aria-label="ariaLabel">
    <button
      v-for="slug in ROOM_TYPES"
      :key="slug"
      type="button"
      class="chip"
      :class="{
        'chip--picked': slug === modelValue && !guessed,
        'chip--guess': slug === modelValue && guessed,
      }"
      :aria-pressed="slug === modelValue"
      @click="$emit('update:modelValue', slug)"
    >
      {{ spaceLabel(slug)
      }}<template v-if="slug === modelValue && guessed">{{
        size === 'draft' ? ' · guess' : ' ?'
      }}</template>
    </button>
  </div>
</template>

<style scoped>
.choice {
  display: flex;
  gap: 6px;
}

/* The phone wraps — six words will not share 390px on one line. The laptop
   does not: the column is a fixed 470px precisely so they line up row to row,
   and a chip that wrapped would take the row's height with it. */
.choice--draft {
  flex-wrap: wrap;
}

.choice--grid {
  gap: 4px;
}

.chip {
  font-family: var(--font-mono);
  font-weight: 400;
  line-height: normal;
  white-space: nowrap;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-chip);
  background: var(--color-bg);
  color: var(--color-fg-2-soft);
  cursor: pointer;
  transition: border-color 120ms ease-out, background-color 120ms ease-out,
    color 120ms ease-out;
}

.choice--draft .chip {
  position: relative;
  padding: 0 10px;
  min-height: 40px;
  font-size: 12px;
}

.choice--grid .chip {
  padding: 6px 8px;
  font-size: 11px;
  /* Quieter than the phone's: at the desk six of these sit in every row of a
     six-row table, and at the phone's weight the column would read as 36 chips
     before it read as a list of rooms. */
  border-color: var(--color-divider);
  color: var(--color-fg-3);
}

/* His. Solid fill, which is the strongest thing this system says about a value. */
.chip--picked {
  background: var(--color-fg);
  border-color: var(--color-fg);
  color: var(--color-bg);
}

/* The system's. Dashed, in full ink — it is the right answer, it is just not
   his yet, and one click is all it takes to make it so. */
.chip--guess {
  border-style: dashed;
  border-color: var(--color-fg);
  background: var(--color-bg);
  color: var(--color-fg);
}

/* Reaching for an unanswered one firms its border and brings the word up to
   full ink — the same answer a field gives a reach. The two answered states
   say what they are already, so a hover must not start taking it back. */
.chip:not(.chip--picked):not(.chip--guess):hover {
  border-color: var(--color-fg-3);
  color: var(--color-fg);
}

.chip:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}


/* The drawn box is 40px and a thumb needs 48. The box keeps the height it is
   drawn at and the target is hung off it, rather than the control growing to
   hold it — the same answer the house's tab bar and header link give. */
.choice--draft .chip::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}

/* On a phone the finger covers the chip, so the press is the whole box filling. */
.choice--draft .chip:active {
  background: var(--color-surface);
}
</style>
