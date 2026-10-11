<script setup lang="ts">
import { SText } from '@/components/atoms'
import RoomTypeChip from '@/components/house/RoomTypeChip.vue'
import { REMOVE_ROOM } from '@/data/houseRoomsCopy'
import type { Room } from '@/types/houseRooms'

/**
 * One room, in the order he walked past its door.
 *
 * Three things and no fourth: where it came in the walk, what he called it, and
 * what it is. There is no edit screen behind the row and no chevron suggesting
 * one — the type is tapped in place and the `×` is beside it, which is the
 * whole of what a room can have done to it on a phone.
 */
defineProps<{ room: Room; index: number }>()

defineEmits<{ cycle: []; remove: [] }>()
</script>

<template>
  <li class="row">
    <SText type="cell-meta" color="fg-3" class="index">{{
      String(index).padStart(2, '0')
    }}</SText>

    <SText type="row-name" class="name">{{ room.name }}</SText>

    <RoomTypeChip :room="room" size="row" @cycle="$emit('cycle')" />

    <button
      type="button"
      class="remove"
      :aria-label="`${REMOVE_ROOM} ${room.name}`"
      @click="$emit('remove')"
    >
      ×
    </button>
  </li>
</template>

<style scoped>
/* 55 rather than the 54 the handoff names: the reference's row is a content
   box with its divider outside it, and this project is border-box throughout,
   so the drawn 54 plus its 1px divider is written as the figure it renders. */
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 0 16px;
  min-height: 55px;
  border-bottom: 1px solid var(--color-divider);
}

.index {
  width: 16px;
  flex: none;
}

/* The name takes whatever the chip and the `×` leave, and ellipsises rather
   than wrapping: a two-line row would break the walk's rhythm down the list. */
.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove {
  position: relative;
  width: 44px;
  min-height: 44px;
  flex: none;
  font-size: 18px;
  line-height: 1;
  border: none;
  background: transparent;
  color: var(--color-fg-3);
  cursor: pointer;
  transition: color 120ms ease-out;
}


/* The drawn box is 44px and a thumb needs 48. The box keeps the height it is
   drawn at and the target is hung off it, rather than the control growing to
   hold it — the same answer the house's tab bar and header link give. */
.remove::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}

.remove:hover {
  color: var(--color-fg);
}

.remove:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
  border-radius: var(--radius-chip);
}
</style>
