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
const props = defineProps<{
  customerId: number
  houseId: number
  rooms: VisitRoom[]
  /** Nothing read yet. A revalidation never empties the list already up. */
  loading?: boolean
  /** The read came back other than 2xx. Said in the card, not as a page banner. */
  failed?: boolean
}>()

defineEmits<{ cycle: [roomId: number] }>()

/** `01`, `02` — the same two-figure index the blocks on the left carry. */
const index = (at: number) => String(at + 1).padStart(2, '0')
</script>

<template>
  <section class="card">
    <div class="head">
      <!-- No count until there is one: `Rooms · 0` while it loads would be a
           statement about the house rather than about the request. -->
      <SText type="micro" color="micro" as="h2">
        Rooms{{ loading || failed ? '' : ` · ${rooms.length}` }}
      </SText>
      <RouterLink
        :to="{ name: 'house-rooms', params: { id: customerId, houseId } }"
        class="link"
      >
        <SText type="tab" color="action-ink">{{ EDIT_ROOMS }}</SText>
      </RouterLink>
    </div>

    <!-- Blocks at the row height, so nothing jumps when they land. -->
    <template v-if="loading">
      <div v-for="n in 3" :key="n" class="row row--inert" aria-hidden="true">
        <span class="bar bar--index" />
        <span class="bar" />
      </div>
    </template>

    <div v-else-if="failed" class="row row--inert">
      <SText type="cell" color="fg-2">Could not read the rooms.</SText>
    </div>

    <div v-else-if="rooms.length === 0" class="row row--inert">
      <SText type="cell" color="fg-2">No rooms yet.</SText>
    </div>

    <template v-else>
      <div v-for="(room, at) in rooms" :key="room.id" class="row">
        <SText type="cell-meta" color="micro">{{ index(at) }}</SText>
        <SText type="ui" class="name">{{ room.name }}</SText>
        <RoomTypeChip :room="room" @cycle="$emit('cycle', room.id)" />
      </div>
    </template>

    <!-- The caption explains the chips, so it goes only where there are some. -->
    <SText v-if="rooms.length > 0 && !loading && !failed" type="caption" class="caption">
      {{ ROOMS_CAPTION }}
    </SText>
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

/* A row that states something rather than listing a room. */
.row--inert {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
}

.bar {
  display: block;
  width: 56%;
  height: 12px;
  background: var(--color-surface);
  border-radius: var(--radius-flag);
}

.bar--index {
  width: 20px;
  flex: none;
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
