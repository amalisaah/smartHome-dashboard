<script setup lang="ts">
import { SText } from '@/components/atoms'
import type { QuoteRoomSummary } from '@/types/quote'

/**
 * The rooms, in walk order, as a horizontal rail.
 *
 * **Rooms come from the house record and are never typed here.** There is no
 * "add a room" on this screen: a room he has not walked is a gap in the house,
 * not a gap in the quote, and it gets filled where the house is recorded.
 *
 * The count after the name is quiet because it is a fact about the room rather
 * than part of its name, and blank when the room is empty — a `0` would read as
 * a figure he had to act on.
 */
defineProps<{ rooms: QuoteRoomSummary[]; activeId: number | null }>()
defineEmits<{ select: [roomId: number] }>()
</script>

<template>
  <div class="rail">
    <button
      v-for="room in rooms"
      :key="room.id"
      type="button"
      class="chip"
      :class="{ 'chip--on': room.id === activeId }"
      :aria-pressed="room.id === activeId"
      @click="$emit('select', room.id)"
    >
      <SText type="list-title" as="span" class="name">{{ room.name }}</SText>
      <SText v-if="room.lineCount" type="cell-meta" class="count">{{ room.lineCount }}</SText>
    </button>
  </div>
</template>

<style scoped>
.rail {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  overflow-x: auto;
  flex: none;
  /* A rail he swipes. A scrollbar under a thumb is noise. */
  scrollbar-width: none;
}

.rail::-webkit-scrollbar {
  display: none;
}

.chip {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 12px;
  background: transparent;
  color: var(--color-fg-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  cursor: pointer;
  white-space: nowrap;
  flex: none;
  transition: background-color 120ms ease-out, border-color 120ms ease-out, color 120ms ease-out;
}

.chip .name,
.chip .count {
  color: inherit;
}

.chip:hover {
  border-color: var(--color-fg-3);
}

.chip:active {
  background: var(--color-surface);
}

.chip:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.chip--on {
  background: var(--color-action);
  border-color: var(--color-action);
  color: var(--color-bg);
}

.chip--on:hover {
  border-color: var(--color-action);
}

.chip--on:active {
  background: var(--color-action-hover);
}

.count {
  opacity: 0.8;
}
</style>
