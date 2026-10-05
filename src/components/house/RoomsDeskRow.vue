<script setup lang="ts">
import { ref, watch } from 'vue'
import { SBadge, SInput, SText } from '@/components/atoms'
import RoomTypeChoice from '@/components/house/RoomTypeChoice.vue'
import { REMOVE_ROOM } from '@/data/houseRoomsCopy'
import { UNTYPED_ROOM } from '@/data/houseVisitCopy'
import type { Room } from '@/types/houseRooms'
import type { ApiSpaceSlug } from '@/types/api'

/**
 * One room at the desk — the same room as on the phone, with the width to fix
 * it in one gesture instead of several.
 *
 * **The name is the field.** Renaming happens here and nowhere else: there is
 * no edit screen, no dialog and no pencil. The field is quiet until he reaches
 * for it, which is what lets a column of them still read as a list of names.
 *
 * **All six types, every row.** The phone cycles because it has no room; the
 * desk has 470px of it, so fixing a type is one click and that click both sets
 * it and confirms it. The column is fixed rather than fluid precisely so the
 * chips line up down the table and a wrong one is found by scanning rather
 * than by reading.
 */
const props = defineProps<{ room: Room; index: number }>()

const emit = defineEmits<{
  rename: [name: string]
  setType: [type: ApiSpaceSlug]
  remove: []
}>()

const name = ref(props.room.name)
const field = ref<InstanceType<typeof SInput> | null>(null)

/** The row's own name changing under it — an undo putting the room back. */
watch(() => props.room.name, (next) => (name.value = next))

/** So a room just added can be renamed by typing over it, with no extra click. */
defineExpose({
  focus: () => field.value?.focus(),
})

/**
 * Leaving the field commits it. A name the field could not keep — blank, or
 * whitespace — is not a rename, so the row takes back the name it had rather
 * than standing there unnamed.
 */
function commit() {
  const wanted = name.value.trim()
  if (wanted) emit('rename', wanted)
  else name.value = props.room.name
}
</script>

<template>
  <div class="row">
    <SText type="cell-meta" color="micro">{{ String(index).padStart(2, '0') }}</SText>

    <div class="name">
      <SInput
        ref="field"
        v-model="name"
        variant="flat"
        size="cell"
        :aria-label="`Room ${index} name`"
        class="field"
        @focusout="commit"
        @keydown.enter="commit"
      />
      <!-- The blank said where it is, rather than only in the chips: a room with
           no type is findable by scanning the names column. -->
      <SBadge v-if="room.type === null" variant="incomplete" size="inline">
        {{ UNTYPED_ROOM }}
      </SBadge>
    </div>

    <RoomTypeChoice
      :model-value="room.type"
      :guessed="room.guessed"
      size="grid"
      :aria-label="`Type for ${room.name}`"
      @update:model-value="emit('setType', $event)"
    />

    <button
      type="button"
      class="remove"
      :title="REMOVE_ROOM"
      :aria-label="`${REMOVE_ROOM} ${room.name}`"
      @click="emit('remove')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 470px 36px;
  gap: 16px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-divider);
  transition: background-color 120ms ease-out;
}

.row:hover {
  background: var(--color-row-hover);
}

.name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* `min-width: 0` on the field as well as on the cell: a flat input inside a
   grid row otherwise widens its column by its own intrinsic width, and the
   table stops lining up under its head. */
.field {
  flex: 1;
  min-width: 0;
}

.remove {
  width: 32px;
  height: 32px;
  font-size: 16px;
  line-height: 1;
  border: none;
  border-radius: var(--radius-chip);
  background: transparent;
  color: var(--color-fg-3);
  cursor: pointer;
  transition: color 120ms ease-out, background-color 120ms ease-out;
}

.remove:hover {
  color: var(--color-fg);
  background: var(--color-surface);
}

.remove:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}
</style>
