<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { SText } from '@/components/atoms'
import HouseInstalledCard from '@/components/house/HouseInstalledCard.vue'
import RoomCommonNames from '@/components/house/RoomCommonNames.vue'
import RoomUndoStrip from '@/components/house/RoomUndoStrip.vue'
import RoomsDeskAddRow from '@/components/house/RoomsDeskAddRow.vue'
import RoomsDeskRow from '@/components/house/RoomsDeskRow.vue'
import RoomsSkeleton from '@/components/house/RoomsSkeleton.vue'
import VisitFactsCard from '@/components/house/VisitFactsCard.vue'
import { SBanner } from '@/components/atoms'
import {
  ROOMS_COLUMN_INDEX,
  ROOMS_COLUMN_NAME,
  ROOMS_COLUMN_TYPE,
  ROOMS_FOOTER_LEGEND,
  roomsFooterCounts,
} from '@/data/houseRoomsCopy'
import type { CommonRoomName, Room, RoomCounts } from '@/types/houseRooms'
import type { ApiSpaceSlug } from '@/types/api'

/**
 * B3 — the same rooms, at the desk, being tidied rather than collected.
 *
 * **Same list, no new fields.** Everything here exists on the phone; what the
 * desk adds is width — six type chips instead of one that cycles, and a name
 * that can be corrected in place. What it deliberately does *not* add is
 * reordering, a save button or a way out to a room's own page: walk order is
 * the house's order and the only thing that could reorder it is walking it
 * again.
 */
const props = defineProps<{
  customerId: number
  houseId: number
  rooms: readonly Room[]
  counts: RoomCounts
  commonNames: readonly CommonRoomName[]
  installedCount: number | null
  /** `wiring_notes` and `internet_notes`, straight off the house. */
  wiring: string
  internet: string
  removedName: string | null
  text: string
  type: ApiSpaceSlug | null
  guessed: boolean
  loading?: boolean
  failed?: boolean
}>()

const emit = defineEmits<{
  'update:text': [value: string]
  pick: [type: ApiSpaceSlug]
  add: []
  addCommon: [common: CommonRoomName]
  rename: [id: number, name: string]
  setType: [id: number, type: ApiSpaceSlug]
  remove: [id: number]
  undo: []
}>()

const rowRefs = ref<InstanceType<typeof RoomsDeskRow>[]>([])

/**
 * A duplicate name was taken as `Bedroom 2` rather than refused, so the row
 * that lands is the one that needs correcting — the caret goes into it with the
 * name selected, and one word over the top of it is the rename. That is B2's
 * "it never asks first", made good at the only place there is a field to put
 * the selection in.
 */
async function selectNewest() {
  await nextTick()
  const last = rowRefs.value[rowRefs.value.length - 1]
  last?.focus()
}

function addFromField() {
  const wasDuplicate = props.rooms.some(
    (room) => room.name.trim().toLowerCase() === props.text.trim().toLowerCase(),
  )
  emit('add')
  if (wasDuplicate) selectNewest()
}

function addCommon(common: CommonRoomName) {
  emit('addCommon', common)
}
</script>

<template>
  <div class="body">
    <div class="table">
      <div class="head">
        <SText type="column-header" color="micro">{{ ROOMS_COLUMN_INDEX }}</SText>
        <SText type="column-header" color="micro">{{ ROOMS_COLUMN_NAME }}</SText>
        <SText type="column-header" color="micro">{{ ROOMS_COLUMN_TYPE }}</SText>
        <span />
      </div>

      <SBanner v-if="failed" variant="error" class="failure">
        Could not read this house's rooms.
      </SBanner>

      <RoomsSkeleton v-else-if="loading" size="desk" />

      <RoomsDeskRow
        v-for="(room, at) in rooms"
        ref="rowRefs"
        :key="room.id"
        :room="room"
        :index="at + 1"
        @rename="emit('rename', room.id, $event)"
        @set-type="emit('setType', room.id, $event)"
        @remove="emit('remove', room.id)"
      />

      <RoomUndoStrip
        v-if="removedName"
        :name="removedName"
        size="desk"
        @undo="emit('undo')"
      />

      <RoomsDeskAddRow
        :text="text"
        :type="type"
        :guessed="guessed"
        @update:text="emit('update:text', $event)"
        @pick="emit('pick', $event)"
        @add="addFromField"
      />

      <RoomCommonNames
        :names="commonNames"
        size="desk"
        class="common"
        @add="addCommon"
      />

      <div class="footer">
        <SText type="cell-meta" color="fg-2-soft">
          {{ roomsFooterCounts(counts.rooms, counts.guessed, counts.untyped) }}
        </SText>
        <SText type="cell-meta" color="fg-2-soft">{{ ROOMS_FOOTER_LEGEND }}</SText>
      </div>
    </div>

    <div class="aside">
      <VisitFactsCard
        :customer-id="customerId"
        :house-id="houseId"
        :wiring="wiring"
        :internet="internet"
      />
      <HouseInstalledCard
        :customer-id="customerId"
        :house-id="houseId"
        :count="installedCount"
      />
    </div>
  </div>
</template>

<style scoped>
.body {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  align-items: start;
  gap: 32px;
  padding: 24px 32px 32px;
}

.table {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* The same four tracks every row below it uses, so the labels sit over the
   columns they name. */
.head {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 470px 36px;
  gap: 16px;
  align-items: center;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--color-line);
}

.failure {
  margin: 16px 0;
}

/* Indented to the names column, because what is under the table belongs to the
   list rather than to the page. */
.common {
  padding: 12px 0 0 52px;
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0 0 52px;
}

.aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/*
 * ⚠️ Not designed. Between the phone's breakpoint and the width the table and
 * its aside both need, the aside drops underneath rather than squeezing the
 * type column — the 470px column is the thing that makes the chips line up, and
 * narrowing it is what the whole layout is arranged to avoid.
 */
@media (max-width: 1240px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
}
</style>
