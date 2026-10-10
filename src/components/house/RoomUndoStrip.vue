<script setup lang="ts">
import { SText } from '@/components/atoms'
import { removedRoomLabel, UNDO } from '@/data/houseRoomsCopy'

/**
 * The whole of the confirmation for removing a room.
 *
 * `×` takes the room **immediately** — no dialog, because he is walking through
 * a house and a dialog is a stop, and because the thing being removed is a word
 * he typed thirty seconds ago. What stands in for the dialog is this: the room
 * is named, and it can be put back, until the next add or remove replaces the
 * offer.
 */
defineProps<{ name: string; size?: 'phone' | 'desk' }>()

defineEmits<{ undo: [] }>()
</script>

<template>
  <div class="strip" :class="`strip--${size ?? 'phone'}`" role="status" aria-live="polite">
    <SText type="meta">{{ removedRoomLabel(name) }}</SText>
    <button type="button" class="undo" @click="$emit('undo')">{{ UNDO }}</button>
  </div>
</template>

<style scoped>
.strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: var(--color-surface);
}

/* At the desk the strip belongs to the table rather than to the frame, so it
   sits in the table's own gutter instead of the screen's. */
.strip--desk {
  padding: 8px 0 8px 52px;
  background: transparent;
}

.undo {
  position: relative;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-action);
  background: transparent;
  border: none;
  border-radius: var(--radius-flag);
  padding: 0 4px;
  min-height: 40px;
  flex: none;
  cursor: pointer;
  transition: color 120ms ease-out;
}


/* The drawn box is 40px and a thumb needs 48. The box keeps the height it is
   drawn at and the target is hung off it, rather than the control growing to
   hold it — the same answer the house's tab bar and header link give. */
.strip--phone .undo::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}

.strip--desk .undo {
  font-size: 13px;
  min-height: 0;
  padding: 4px;
}

.undo:hover {
  color: var(--color-action-hover);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.undo:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
</style>
