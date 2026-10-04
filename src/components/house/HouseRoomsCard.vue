<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { SText } from '@/components/atoms'
import RoomTypeChip from '@/components/house/RoomTypeChip.vue'
import { EDIT_ROOMS, ROOMS_CAPTION } from '@/data/houseVisitCopy'
import type { VisitRoom } from '@/types/houseVisit'

/**
 * The rooms, beside the notes rather than behind a tab — so that at the desk
 * the visit and what it found are on screen together, and a guessed type gets
 * confirmed while he is reading the note that mentions it.
 *
 * **Only the type is editable here.** Renaming, adding, removing and reordering
 * are block B's, and `Edit rooms` is the door to them. One click on a chip is
 * the whole of what this card does, which is why it can sit in a column that is
 * otherwise read-only.
 *
 * The index is the room's position in the list the house was given, not an id.
 */
defineProps<{
  customerId: number
  houseId: number
  rooms: VisitRoom[]
}>()

defineEmits<{ cycle: [roomId: number] }>()

/** `01`, `02` — the same two-figure index the blocks on the left carry. */
const index = (at: number) => String(at + 1).padStart(2, '0')
</script>

<template>
  <section class="card">
    <div class="head">
      <SText type="micro" color="micro" as="h2">Rooms · {{ rooms.length }}</SText>
      <RouterLink
        :to="{ name: 'house-rooms', params: { id: customerId, houseId } }"
        class="link"
      >
        <SText type="tab" color="action-ink">{{ EDIT_ROOMS }}</SText>
      </RouterLink>
    </div>

    <div v-for="(room, at) in rooms" :key="room.id" class="row">
      <SText type="cell-meta" color="micro">{{ index(at) }}</SText>
      <SText type="ui" class="name">{{ room.name }}</SText>
      <RoomTypeChip :room="room" @cycle="$emit('cycle', room.id)" />
    </div>

    <SText type="caption" class="caption">{{ ROOMS_CAPTION }}</SText>
  </section>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-line);
}

.row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-divider);
}

.name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The caption explains the dashes, so it belongs under the rows rather than in
   the header where it would be read before there was anything dashed to see. */
.caption {
  padding-top: 10px;
  line-height: 1.6;
}

.link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  border-radius: var(--radius-flag);
}

.link:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
</style>
