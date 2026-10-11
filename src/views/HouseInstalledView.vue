<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomer } from '@/api/hooks/customers'
import { useHouse, useHouseRooms, useInstalledGroups } from '@/api/hooks/houses'
import AppLayout from '@/components/app/AppLayout.vue'
import HouseDeskHead from '@/components/house/HouseDeskHead.vue'
import HouseTabBar from '@/components/house/HouseTabBar.vue'
import HouseVisitPhoneHeader from '@/components/house/HouseVisitPhoneHeader.vue'
import InstalledDesk from '@/components/house/InstalledDesk.vue'
import InstalledPhone from '@/components/house/InstalledPhone.vue'
import { installedSummary, offlineCopy, updatedByJob } from '@/data/installedCopy'
import { useHouseInstalledEditor } from '@/composables/useHouseInstalledEditor'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { useSaveReporter } from '@/composables/useSaveState'
import { formatMonthYear } from '@/utils/format'
import { installedUnits, lastJobDate, toInstalledRooms } from '@/utils/mapper/installedMapper'
import type { BeforeYouTouch } from '@/types/installed'
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
 * **Three reads, and the screen is a fold of two of them.** The rooms are the
 * walk; the installed rows are what hangs off each; the house carries the three
 * lines a fixer reads first. The rooms are read separately and deliberately:
 * the grouped devices endpoint only answers with rooms that hold something, and
 * an empty room — `Back bedroom · nothing installed` — is the one the design
 * most wants on screen. See `toInstalledRooms` for how the two meet.
 *
 * **Counts only, and never which unit.** Nothing on either frame can express a
 * serial or a position, because the record cannot hold one.
 *
 * **No save button.** `Done` leaves the mode; a stepped count is kept as it is
 * stepped and flips its own row to `by hand` — see `useHouseInstalledEditor`,
 * and for the one move this API cannot make.
 */
const props = defineProps<{ customerId: number; houseId: number }>()

const router = useRouter()
const isPhone = useMediaQuery('(max-width: 899px)')
const online = useOnline()

const customerQuery = useCustomer(() => props.customerId)
const houseQuery = useHouse(() => props.houseId)
const roomsQuery = useHouseRooms(() => props.houseId)
const installedQuery = useInstalledGroups(() => props.houseId)

const customerName = computed(() => customerQuery.data.value?.name ?? 'This customer')

/** The walk, with what is on the wall in each room hung off it. */
const record = computed(() =>
  toInstalledRooms(roomsQuery.data.value ?? [], installedQuery.data.value ?? []),
)

const installed = useHouseInstalledEditor(props.houseId)

watch(record, (next) => installed.seed(next), { immediate: true })

/** The laptop says save state in the app bar, as every other desk screen does. */
const save = useSaveReporter()
watch(installed.refused, (bad) => (bad ? save.failed() : save.saved()))

const roomCount = computed(() =>
  roomsQuery.isSuccess.value ? (roomsQuery.data.value?.length ?? 0) : null,
)

/** Units on the wall — the same figure every tab bar in the house shows. */
const installedCount = computed(() =>
  installedQuery.isSuccess.value ? installedUnits(installedQuery.data.value ?? []) : null,
)

/** When a job last wrote this record. Null until the jobs module writes one. */
const lastJob = computed(() => lastJobDate(installedQuery.data.value ?? []))

/**
 * The three lines a fixer reads first, off the house's own notes.
 *
 * ⚠️ The handoff calls these "short read-only summaries"; nothing summarises
 * anything, so they are the notes as written. A long wiring note will read long
 * here, where the reference draws one line.
 */
const facts = computed<BeforeYouTouch>(() => ({
  wiring: houseQuery.data.value?.wiring_notes ?? '',
  internet: houseQuery.data.value?.internet_notes ?? '',
  access: houseQuery.data.value?.access_notes ?? '',
}))

const summary = computed(() =>
  installedSummary(
    customerQuery.data.value ? formatMonthYear(customerQuery.data.value.createdAt) : null,
    lastJob.value,
  ),
)

/**
 * `isPending` is "nothing cached yet", so a revalidation never re-skeletons —
 * and the list a stepper has just moved is never replaced by a loading state.
 */
const loading = computed(
  () => installedQuery.isPending.value && installed.rooms.value.length === 0,
)

const failed = computed(
  () => installedQuery.isError.value && installed.rooms.value.length === 0,
)

/**
 * Off by default, on both devices: the current picture is what somebody
 * standing in the house needs, and struck-through lines in it are things that
 * are not there.
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
    ? { label: updatedByJob(lastJob.value), tone: 'quiet', dot: false }
    : { label: offlineCopy(lastJob.value), tone: 'risk', dot: true },
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
        :room-count="roomCount"
        :installed-count="installedCount"
        size="phone"
      />

      <InstalledPhone
        :customer-id="customerId"
        :house-id="houseId"
        :rooms="installed.rooms.value"
        :totals="installed.totals.value"
        :facts="facts"
        :last-job-date="lastJob"
        :show-removed="showRemoved"
        :loading="loading"
        :failed="failed"
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
        :room-count="roomCount"
        :installed-count="installedCount"
        :summary="summary"
      />

      <InstalledDesk
        :customer-id="customerId"
        :house-id="houseId"
        :rooms="installed.rooms.value"
        :totals="installed.totals.value"
        :facts="facts"
        :show-removed="showRemoved"
        :correcting="correcting"
        :loading="loading"
        :failed="failed"
        :can-step="installed.canStep"
        @toggle-removed="showRemoved = !showRemoved"
        @correct="correcting = true"
        @done="correcting = false"
        @step="installed.step"
      />
    </template>
  </AppLayout>
</template>
