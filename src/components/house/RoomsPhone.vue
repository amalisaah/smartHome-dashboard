<script setup lang="ts">
import { ref } from 'vue'
import RoomUndoStrip from '@/components/house/RoomUndoStrip.vue'
import RoomsEntryDock from '@/components/house/RoomsEntryDock.vue'
import RoomsInterruption from '@/components/house/RoomsInterruption.vue'
import RoomsPhoneRow from '@/components/house/RoomsPhoneRow.vue'
import RoomsSkeleton from '@/components/house/RoomsSkeleton.vue'
import { SBanner } from '@/components/atoms'
import {
  RESUME_TITLE,
  resumeCopy,
  untypedCopy,
  untypedTitle,
} from '@/data/houseRoomsCopy'
import type { CommonRoomName, Room } from '@/types/houseRooms'
import type { ResumedEntry } from '@/composables/useRoomEntry'
import type { ApiSpaceSlug } from '@/types/api'

/**
 * B1 — naming every room in one pass, standing in the house.
 *
 * The list is above and the dock is below, because that is where his thumb is
 * and because the keyboard is under the dock. He types a name, presses return,
 * and walks to the next door; the row appears above without the field so much
 * as blinking.
 */
defineProps<{
  rooms: readonly Room[]
  commonNames: readonly CommonRoomName[]
  untyped: readonly Room[]
  removedName: string | null
  text: string
  type: ApiSpaceSlug | null
  guessed: boolean
  resumed: ResumedEntry | null
  /** Nothing read yet. The dock below is live throughout either way. */
  loading?: boolean
  /** The read failed. Said where the list would have been, and nowhere else. */
  failed?: boolean
}>()

const emit = defineEmits<{
  'update:text': [value: string]
  pick: [type: ApiSpaceSlug]
  add: []
  addCommon: [common: CommonRoomName]
  cycle: [id: number]
  remove: [id: number]
  undo: []
}>()

const dock = ref<InstanceType<typeof RoomsEntryDock> | null>(null)

/**
 * Removing a room must not cost him the caret: the `×` is up in the list and
 * the field is down in the dock, and a thumb that reached up to delete a typo
 * is coming straight back down to the next room's name.
 */
function remove(id: number) {
  emit('remove', id)
  dock.value?.focus()
}

function undo() {
  emit('undo')
  dock.value?.focus()
}
</script>

<template>
  <div class="screen">
    <div>
      <!-- B2. Both are notes about work already kept, so they sit above the
           list rather than over it, and neither has anything to dismiss. -->
      <div v-if="resumed || untyped.length > 0" class="cards">
        <RoomsInterruption
          v-if="resumed"
          tone="resume"
          :title="RESUME_TITLE"
          :detail="resumeCopy(resumed.at, resumed.text)"
        />
        <RoomsInterruption
          v-if="untyped.length > 0"
          tone="untyped"
          :title="untypedTitle(untyped.length)"
          :detail="untypedCopy(untyped.map((room) => room.name))"
        />
      </div>

      <!-- The failure is reported where the names would have been: the field
           below is still the screen, and he can go on naming rooms. -->
      <SBanner v-if="failed" variant="error" class="failure">
        Could not read this house's rooms.
      </SBanner>

      <RoomsSkeleton v-else-if="loading" size="phone" />

      <ol v-else class="list">
        <RoomsPhoneRow
          v-for="(room, at) in rooms"
          :key="room.id"
          :room="room"
          :index="at + 1"
          @cycle="emit('cycle', room.id)"
          @remove="remove(room.id)"
        />
      </ol>

      <!-- It stays until the next add or remove replaces the offer. -->
      <RoomUndoStrip v-if="removedName" :name="removedName" @undo="undo" />
    </div>

    <RoomsEntryDock
      ref="dock"
      :text="text"
      :type="type"
      :guessed="guessed"
      :common-names="commonNames"
      @update:text="emit('update:text', $event)"
      @pick="emit('pick', $event)"
      @add="emit('add')"
      @add-common="emit('addCommon', $event)"
      class="entry-dock"
    />
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
}

/* The field is the one thing on this screen that may never be scrolled away
   from, because it is the only thing he is doing — so the dock sticks to the
   bottom of the viewport and the list runs behind it. Sticky rather than fixed:
   it is still in the flow, so a short list ends above it instead of under it,
   and the browser lifts it with the keyboard rather than leaving it beneath. */
.entry-dock {
  position: sticky;
  bottom: 0;
  z-index: 1;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.failure {
  margin: 16px;
}

/* The drawn floor, so an empty house is still a list waiting for rooms rather
   than a field with nothing above it. */
.list {
  display: flex;
  flex-direction: column;
  min-height: 300px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
