<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomer } from '@/api/hooks/customers'
import AppLayout from '@/components/app/AppLayout.vue'
import HouseDeskHead from '@/components/house/HouseDeskHead.vue'
import HouseTabBar from '@/components/house/HouseTabBar.vue'
import HouseVisitPhoneHeader from '@/components/house/HouseVisitPhoneHeader.vue'
import InstalledDesk from '@/components/house/InstalledDesk.vue'
import InstalledPhone from '@/components/house/InstalledPhone.vue'
import { offlineCopy, updatedByJob } from '@/data/installedCopy'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { useHouseInstalledStore } from '@/stores/houseInstalled'
import { useHouseRoomsStore } from '@/stores/houseRooms'
import type { HeaderStatus } from '@/types/house'

/**
 * Module 5, block C — the house's **What's installed** tab.
 *
 * One record, two frames. Below ~900px it is C1: a briefing read in a doorway
 * before touching a switch, with correcting a room demoted to a link that opens
 * C2. At ~900px and up it is C3: the same record as one table, read like a
 * stock sheet, with correction as a **mode of that table** rather than a screen
 * of its own.
 *
 * **Counts only, and never which unit.** Nothing on either frame can express a
 * serial or a position, because the record cannot hold one.
 *
 * **No save button.** `Done` leaves the mode; a stepped count is kept as it is
 * stepped and flips its own row to `by hand` — see `@/stores/houseInstalled`.
 */
const props = defineProps<{ customerId: number; houseId: number }>()

const router = useRouter()
const isPhone = useMediaQuery('(max-width: 899px)')
const online = useOnline()

const customerQuery = useCustomer(() => props.customerId)
const customerName = computed(() => customerQuery.data.value?.name ?? 'This customer')

const installed = useHouseInstalledStore(props.houseId)
const rooms = useHouseRoomsStore(props.houseId)

/**
 * Off by default, on both devices: the current picture is what somebody
 * standing in the house needs, and three struck-through lines in it are three
 * things that are not there.
 */
const showRemoved = ref(false)

/** Read, or correcting. A mode of the table rather than a place he has gone. */
const correcting = ref(false)

/**
 * Who wrote this record, in the place Visit notes says where his typing got to.
 * No dot: it is a fact about the record rather than something that just
 * happened, and a dot beside it would read as news.
 */
const status = computed<HeaderStatus>(() =>
  online.value
    ? { label: updatedByJob(installed.lastJobDate), tone: 'quiet', dot: false }
    : { label: offlineCopy(installed.lastJobDate), tone: 'risk', dot: true },
)

/**
 * ⚑ The handoff's `Correct by hand` link opens C2 "for a room" without saying
 * which, and the footer it sits in belongs to no room in particular. So there
 * are two doors to the same screen and neither asks a question: tapping a room
 * corrects that room, and the footer link — the one the handoff draws — takes
 * the first room in walk order, which is where the walk starts.
 */
const correctRoom = (roomId: number) =>
  router.push({
    name: 'house-installed-correct',
    params: { id: props.customerId, houseId: props.houseId, roomId },
  })
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <!-- === C1 — the briefing === -->
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
        :installed-count="installed.totals.value.active"
        size="phone"
      />

      <InstalledPhone
        :customer-id="customerId"
        :house-id="houseId"
        :rooms="installed.rooms.value"
        :totals="installed.totals.value"
        :facts="installed.beforeYouTouch"
        :last-job-date="installed.lastJobDate"
        :show-removed="showRemoved"
        @toggle-removed="showRemoved = !showRemoved"
        @correct="correctRoom"
      />
    </template>

    <!-- === C3 — the stock sheet === -->
    <template v-else>
      <HouseDeskHead
        :customer-id="customerId"
        :house-id="houseId"
        :customer-name="customerName"
        :room-count="rooms.counts.value.rooms"
        :installed-count="installed.totals.value.active"
        :summary="installed.summaryPhrase"
      />

      <InstalledDesk
        :customer-id="customerId"
        :house-id="houseId"
        :rooms="installed.rooms.value"
        :totals="installed.totals.value"
        :facts="installed.beforeYouTouch"
        :show-removed="showRemoved"
        :correcting="correcting"
        @toggle-removed="showRemoved = !showRemoved"
        @correct="correcting = true"
        @done="correcting = false"
        @step="installed.step"
      />
    </template>
  </AppLayout>
</template>
