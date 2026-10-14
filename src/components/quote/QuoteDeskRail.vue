<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { SSegmented, SText } from '@/components/atoms'
import { formatMoney } from '@/utils/format'
import type { GroupBy } from '@/composables/useQuoteBuilder'
import type { QuoteHeader, QuoteRoomSummary } from '@/types/quote'

/**
 * The left rail: whose quote this is, which way to read it, and the rooms.
 *
 * Clicking a room selects it **and** switches to By room, because By need is a
 * read-only check — picking a room there means "take me to where I can edit
 * this", and leaving him on a list he cannot type into would be a dead click.
 */
defineProps<{
  header: QuoteHeader
  surname: string
  area: string | null
  rooms: QuoteRoomSummary[]
  activeId: number | null
  groupBy: GroupBy
}>()

defineEmits<{ select: [roomId: number]; 'update:groupBy': [value: GroupBy] }>()

const GROUP_OPTIONS = [
  { label: 'By room', value: 'room' as const },
  { label: 'By need', value: 'need' as const },
]
</script>

<template>
  <div class="rail">
    <div class="who">
      <RouterLink :to="{ name: 'quotes' }" class="crumb">
        <SText type="row-meta" color="fg-2-soft">Quotes ›</SText>
      </RouterLink>
      <SText type="frame-title" as="h1">
        {{ surname }}<template v-if="area"> — {{ area }}</template>
      </SText>
      <SText type="cell-meta" color="fg-2">
        Quote {{ String(header.id).padStart(4, '0') }} · {{ header.status }} · {{ header.level }}
      </SText>
    </div>

    <div class="seg">
      <SSegmented
        :model-value="groupBy"
        :options="GROUP_OPTIONS"
        @update:model-value="$emit('update:groupBy', $event)"
      />
    </div>

    <SText type="micro" class="label">Rooms · from the house</SText>

    <button
      v-for="room in rooms"
      :key="room.id"
      type="button"
      class="room"
      :class="{ 'room--on': room.id === activeId }"
      :aria-current="room.id === activeId ? 'true' : undefined"
      @click="$emit('select', room.id)"
    >
      <span class="room-text">
        <SText :type="room.id === activeId ? 'ui' : 'cell'" as="span">{{ room.name }}</SText>
        <SText type="cell-meta" color="fg-2">
          {{ room.lineCount ? `${room.lineCount} line${room.lineCount === 1 ? '' : 's'}` : 'empty' }}
        </SText>
      </span>
      <SText type="list-meta" color="fg-2">
        {{ room.lineCount ? formatMoney(room.totalPesewas) : '—' }}
      </SText>
    </button>
  </div>
</template>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 12px;
  border-right: 1px solid var(--color-line);
  overflow-y: auto;
}

.who {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 12px 14px;
}

.crumb {
  text-decoration: none;
}

.crumb:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.seg {
  margin: 0 4px 10px;
}

.seg :deep(.s-seg) {
  display: flex;
  width: 100%;
}

.label {
  padding: 4px 12px 6px;
}

.room {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  /* The left border is the marker, so the box is square on that side. */
  border-left: 2px solid transparent;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.room-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.room:hover {
  background: var(--color-surface);
}

.room:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.room--on {
  background: var(--color-surface);
  border-left-color: var(--color-action);
}
</style>
