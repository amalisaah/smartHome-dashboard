<script setup lang="ts">
import { computed } from 'vue'
import { useCustomer } from '@/api/hooks/customers'
import AppLayout from '@/components/app/AppLayout.vue'
import HouseDeskHead from '@/components/house/HouseDeskHead.vue'
import HouseTabBar from '@/components/house/HouseTabBar.vue'
import HouseVisitPhoneHeader from '@/components/house/HouseVisitPhoneHeader.vue'
import RoomsDesk from '@/components/house/RoomsDesk.vue'
import RoomsPhone from '@/components/house/RoomsPhone.vue'
import { heldRoomsStatus, savedRoomsStatus } from '@/data/houseRoomsCopy'
import { MOCK_ROOMS_SUMMARY } from '@/data/houseRecordMock'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { useRoomEntry } from '@/composables/useRoomEntry'
import { useHouseInstalledStore } from '@/stores/houseInstalled'
import { useHouseRoomsStore } from '@/stores/houseRooms'
import type { CommonRoomName } from '@/types/houseRooms'
import type { HeaderStatus } from '@/types/house'

/**
 * Module 5, block B — the house's **Rooms** tab.
 *
 * One list, two frames. Below ~900px it is B1: the walk itself, one field above
 * the keyboard that never closes, a name and a return per door. At ~900px and
 * up it is B3: the same rooms at the desk, with the width to fix a type in one
 * click and rename in place. There is no third layout, and B3 collects nothing
 * B1 does not.
 *
 * **No save button, on either.** A room is in the list the moment it is named,
 * and a type is his the moment he taps it — see `@/stores/houseRooms` for where
 * a keystroke goes, and for why it does not currently go to the API.
 */
const props = defineProps<{ customerId: number; houseId: number }>()

const isPhone = useMediaQuery('(max-width: 899px)')
const online = useOnline()

const customerQuery = useCustomer(() => props.customerId)
const customerName = computed(() => customerQuery.data.value?.name ?? 'This customer')

const store = useHouseRoomsStore(props.houseId)
const entry = useRoomEntry(props.houseId)

/**
 * The Installed tab's count, read off the same record the Installed tab reads —
 * the two tabs are two views of one house, and a tab bar that disagreed with
 * the screen under it would be the first thing he stopped trusting.
 */
const installed = useHouseInstalledStore(props.houseId)
const installedCount = computed(() => installed.totals.value.active)

const roomCount = computed(() => store.counts.value.rooms)

/**
 * `saved · 6 rooms`, or the amber line that says they are on the phone. Both
 * are about the rooms, because that is what this tab holds; neither is about
 * progress, because nothing here waits on the network.
 */
const status = computed<HeaderStatus>(() =>
  online.value
    ? { label: savedRoomsStatus(roomCount.value), tone: 'action', dot: true }
    : { label: heldRoomsStatus(roomCount.value), tone: 'risk', dot: true },
)

/** Return, or `Add`, or the `+` at the desk. All three are this. */
function add() {
  const taken = entry.take()
  if (taken) store.add(taken.name, taken.type, taken.guessed)
}

/** One tap on a common name: a room, named and typed, without the field moving. */
function addCommon(common: CommonRoomName) {
  store.add(common.name, common.type, false)
}
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <!-- === B1 / B2 — the walk === -->
    <template v-if="isPhone">
      <HouseVisitPhoneHeader
        :customer-name="customerName"
        :back-to="{ name: 'customer-detail', params: { id: customerId } }"
        :saved-label="null"
        :offline="!online"
        :status="status"
      />

      <HouseTabBar
        :customer-id="customerId"
        :house-id="houseId"
        :room-count="roomCount"
        :installed-count="installedCount"
        size="phone"
      />

      <RoomsPhone
        :rooms="store.rooms.value"
        :common-names="store.commonNames.value"
        :untyped="store.untyped.value"
        :removed-name="store.undo.value?.room.name ?? null"
        :text="entry.text.value"
        :type="entry.type.value"
        :guessed="entry.guessed.value"
        :resumed="entry.resumed.value"
        @update:text="entry.text.value = $event"
        @pick="entry.pick"
        @add="add"
        @add-common="addCommon"
        @cycle="store.cycle"
        @remove="store.remove"
        @undo="store.undoRemove"
      />
    </template>

    <!-- === B3 — the desk === -->
    <template v-else>
      <HouseDeskHead
        :customer-id="customerId"
        :house-id="houseId"
        :customer-name="customerName"
        :room-count="roomCount"
        :installed-count="installedCount"
        :summary="MOCK_ROOMS_SUMMARY"
      />

      <RoomsDesk
        :customer-id="customerId"
        :house-id="houseId"
        :rooms="store.rooms.value"
        :counts="store.counts.value"
        :common-names="store.commonNames.value"
        :installed-count="installedCount"
        :removed-name="store.undo.value?.room.name ?? null"
        :text="entry.text.value"
        :type="entry.type.value"
        :guessed="entry.guessed.value"
        @update:text="entry.text.value = $event"
        @pick="entry.pick"
        @add="add"
        @add-common="addCommon"
        @rename="store.rename"
        @set-type="store.setType"
        @remove="store.remove"
        @undo="store.undoRemove"
      />
    </template>
  </AppLayout>
</template>
