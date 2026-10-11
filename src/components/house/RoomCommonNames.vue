<script setup lang="ts">
import type { CommonRoomName } from '@/types/houseRooms'

/**
 * The eight names most houses have, one tap each.
 *
 * It is not a list of suggestions — tapping one **adds the room**, named and
 * typed, without the field being touched. That is why a name drops out of the
 * row once it is in the list: the row is the rooms he has not got to, and a
 * house has one Kitchen.
 *
 * ⚠️ Drawn as its own control rather than as an `SButton`. It rests on `--bg`
 * (on the phone it sits on the dock's `--surface`, and a surface chip on a
 * surface ground is not a chip), and it answers a reach with the **action
 * border** rather than a fill, because what it offers is an action and not a
 * second place to stand. No existing variant pairs those two: `secondary` has
 * the ground and fills on hover, `chrome` has the hover and the wrong ground.
 * One implementation, two doors — the phone's 44px thumb and the laptop's
 * inline chip — so it stays one control if it is ever promoted to an atom.
 */
withDefaults(
  defineProps<{
    names: readonly CommonRoomName[]
    /** `phone` scrolls sideways under the field; `desk` wraps under the table. */
    size?: 'phone' | 'desk'
  }>(),
  { size: 'phone' },
)

defineEmits<{ add: [common: CommonRoomName] }>()
</script>

<template>
  <div v-if="names.length > 0" class="names" :class="`names--${size}`">
    <button
      v-for="common in names"
      :key="common.name"
      type="button"
      class="name"
      @click="$emit('add', common)"
    >
      + {{ common.name }}
    </button>
  </div>
</template>

<style scoped>
.names {
  display: flex;
  gap: 8px;
}

/* One line that scrolls, not a wrapping block: the dock sits above the keyboard
   and may not grow a row taller every time a name is long. */
.names--phone {
  overflow-x: auto;
}

.names--desk {
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.name {
  font-family: var(--font-sans);
  font-weight: 500;
  white-space: nowrap;
  flex: none;
  border: 1px solid var(--color-line);
  background: var(--color-bg);
  color: var(--color-fg);
  cursor: pointer;
  transition: border-color 120ms ease-out, background-color 120ms ease-out;
}

.names--phone .name {
  position: relative;
  padding: 0 12px;
  min-height: 44px;
  font-size: 14px;
  border-radius: var(--radius-md);
}

.names--desk .name {
  padding: 6px 10px;
  font-size: 13px;
  border-radius: var(--radius-chip);
}


/* The drawn box is 44px and a thumb needs 48. The box keeps the height it is
   drawn at and the target is hung off it, rather than the control growing to
   hold it — the same answer the house's tab bar and header link give. */
.names--phone .name::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}

/* The action border, because reaching for one of these is reaching for the act
   of adding a room — not for somewhere to put the cursor. */
.name:hover {
  border-color: var(--color-action);
}

.name:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.name:active {
  background: var(--color-surface);
}
</style>
