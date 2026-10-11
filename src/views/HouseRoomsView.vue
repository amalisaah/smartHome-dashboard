<script setup lang="ts">
import { computed, watch } from 'vue'
import { useCustomer } from '@/api/hooks/customers'
import { useHouse, useHouseRooms, useInstalledGroups } from '@/api/hooks/houses'
import AppLayout from '@/components/app/AppLayout.vue'
import HouseDeskHead from '@/components/house/HouseDeskHead.vue'
import HouseTabBar from '@/components/house/HouseTabBar.vue'
import HouseVisitPhoneHeader from '@/components/house/HouseVisitPhoneHeader.vue'
import RoomsDesk from '@/components/house/RoomsDesk.vue'
import RoomsPhone from '@/components/house/RoomsPhone.vue'
import { heldRoomsStatus, savedRoomsStatus } from '@/data/houseRoomsCopy'
import { useHouseRoomsEditor } from '@/composables/useHouseRoomsEditor'
import { installedUnits } from '@/utils/mapper/installedMapper'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { useRoomEntry } from '@/composables/useRoomEntry'
import { useSaveReporter } from '@/composables/useSaveState'
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
 * **Three reads, three fates.** The rooms are the screen; the house's wiring
 * and internet notes are a card beside them; the installed count is a number in
 * a tab. None of them holds up another, and none of them holds up the field —
 * a man standing in a hallway does not wait on a count before he can write down
 * the name of the room he is in.
 *
 * **No save button.** A room is in the list the moment it is named and in the
 * record a moment later; see `useHouseRoomsEditor` for where a keystroke goes,
 * and for the three places the design and the wire do not meet.
 */
const props = defineProps<{ customerId: number; houseId: number }>()

const isPhone = useMediaQuery('(max-width: 899px)')
const online = useOnline()

const customerQuery = useCustomer(() => props.customerId)
const houseQuery = useHouse(() => props.houseId)
const roomsQuery = useHouseRooms(() => props.houseId)
const installedQuery = useInstalledGroups(() => props.houseId)

const customerName = computed(() => customerQuery.data.value?.name ?? 'This customer')

/**
 * The count, or null while it is still being read. A tab that showed `· 0`
 * before the answer came back would be stating something about the house.
 */
const installedCount = computed(() =>
  installedQuery.isSuccess.value ? installedUnits(installedQuery.data.value ?? []) : null,
)

/** The two notes beside the list. They decide what each room can take. */
const wiring = computed(() => houseQuery.data.value?.wiring_notes ?? '')
const internet = computed(() => houseQuery.data.value?.internet_notes ?? '')

// --- what he types and what it does -----------------------------------------

const rooms = useHouseRoomsEditor(props.houseId)
const entry = useRoomEntry(props.houseId)

/** The laptop says save state in the app bar, as every other desk screen does. */
const save = useSaveReporter()

watch(
  () => roomsQuery.data.value,
  (next) => {
    if (next) rooms.seed(next)
  },
  { immediate: true },
)

/**
 * A write that was refused is said; one that merely has not left the phone is
 * not an error, and the header is already saying there is no signal.
 */
watch(rooms.refused, (bad) => (bad ? save.failed() : save.saved()))

/**
 * `isPending` is "nothing cached yet", so a revalidation never re-skeletons —
 * and a list he has already added to is never replaced by one.
 */
const loadingRooms = computed(
  () => roomsQuery.isPending.value && rooms.rooms.value.length === 0,
)

const failedRooms = computed(
  () => roomsQuery.isError.value && rooms.rooms.value.length === 0,
)

/**
 * `saved · 6 rooms`, or the amber line that says they are on the phone. Both
 * are about the rooms, because that is what this tab holds; neither is about
 * progress, because nothing here waits on the network.
 */
const status = computed<HeaderStatus>(() =>
  online.value
    ? { label: savedRoomsStatus(rooms.counts.value.rooms), tone: 'action', dot: true }
    : { label: heldRoomsStatus(rooms.counts.value.rooms), tone: 'risk', dot: true },
)

/** Return, or `Add`, or the `+` at the desk. All three are this. */
function add() {
  const taken = entry.take()
  if (taken) void rooms.add(taken.name, taken.type, taken.guessed)
}

/** One tap on a common name: a room, named and typed, without the field moving. */
function addCommon(common: CommonRoomName) {
  void rooms.add(common.name, common.type, false)
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
        :room-count="rooms.counts.value.rooms"
        :installed-count="installedCount"
        size="phone"
      />

      <RoomsPhone
        :rooms="rooms.rooms.value"
        :common-names="rooms.commonNames.value"
        :untyped="rooms.untyped.value"
        :removed-name="rooms.undo.value?.room.name ?? null"
        :text="entry.text.value"
        :type="entry.type.value"
        :guessed="entry.guessed.value"
        :resumed="entry.resumed.value"
        :loading="loadingRooms"
        :failed="failedRooms"
        @update:text="entry.text.value = $event"
        @pick="entry.pick"
        @add="add"
        @add-common="addCommon"
        @cycle="rooms.cycle"
        @remove="rooms.remove"
        @undo="rooms.undoRemove"
      />
    </template>

    <!-- === B3 — the desk === -->
    <template v-else>
      <!--
        ⚠️ No summary phrase. The reference draws `visited 30 Sep · 13:41–14:02 ·
        on phone` beside the title, and nothing on the wire says any of it: the
        house carries `updated_at`, which is when the record last changed rather
        than when anyone stood in it, and nothing at all about the span or the
        device. It is left off rather than filled in with the nearest figure.
      -->
      <HouseDeskHead
        :customer-id="customerId"
        :house-id="houseId"
        :customer-name="customerName"
        :room-count="rooms.counts.value.rooms"
        :installed-count="installedCount"
      />

      <RoomsDesk
        :customer-id="customerId"
        :house-id="houseId"
        :rooms="rooms.rooms.value"
        :counts="rooms.counts.value"
        :common-names="rooms.commonNames.value"
        :installed-count="installedCount"
        :wiring="wiring"
        :internet="internet"
        :removed-name="rooms.undo.value?.room.name ?? null"
        :text="entry.text.value"
        :type="entry.type.value"
        :guessed="entry.guessed.value"
        :loading="loadingRooms"
        :failed="failedRooms"
        @update:text="entry.text.value = $event"
        @pick="entry.pick"
        @add="add"
        @add-common="addCommon"
        @rename="rooms.rename"
        @set-type="rooms.setType"
        @remove="rooms.remove"
        @undo="rooms.undoRemove"
      />
    </template>
  </AppLayout>
</template>
