<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCustomer } from '@/api/hooks/customers'
import { useHouse, useHouseRooms, useInstalledCount } from '@/api/hooks/houses'
import { SBanner, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import HouseTabBar from '@/components/house/HouseTabBar.vue'
import HouseVisitDesk from '@/components/house/HouseVisitDesk.vue'
import HouseVisitPhone from '@/components/house/HouseVisitPhone.vue'
import HouseVisitPhoneHeader from '@/components/house/HouseVisitPhoneHeader.vue'
import HouseVisitSkeleton from '@/components/house/HouseVisitSkeleton.vue'
import VisitFooterPhone from '@/components/house/VisitFooterPhone.vue'
import VisitOfflineNotice from '@/components/house/VisitOfflineNotice.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { useSaveReporter } from '@/composables/useSaveState'
import { useVisitNotes } from '@/composables/useVisitNotes'
import { toVisitNotes, toVisitPin } from '@/utils/mapper/houseVisitMapper'

/**
 * Module 5, block A — the house's **Visit notes** tab.
 *
 * One screen, two frames. Below ~900px it is A1: the visit itself, filled
 * standing in her house, one handed, as a single scroll in the order he meets
 * things. At ~900px and up it is A3: the same fields in the same words in the
 * same order, laid out as a document he reviews before quoting. There is no
 * third layout, and nothing is captured on one that is not captured on the
 * other.
 *
 * Four reads, four fates — her name, the house, its rooms, its device count.
 * None of them holds up another, and none of them holds up a field he can type
 * into: a man standing in someone's compound does not wait for a count before
 * he can write down how to get back there.
 *
 * Two writes, both in `useVisitNotes`: `PATCH /houses/{id}` for the fields and
 * the pin, `PATCH /rooms/{id}` for a room's type. There is no save button,
 * because there is nothing to press — see that file for where a keystroke goes.
 */
const props = defineProps<{ customerId: number; houseId: number }>()

const router = useRouter()
const isPhone = useMediaQuery('(max-width: 899px)')
const online = useOnline()

const customerQuery = useCustomer(() => props.customerId)
const houseQuery = useHouse(() => props.houseId)
const roomsQuery = useHouseRooms(() => props.houseId)
const installedQuery = useInstalledCount(() => props.houseId)

const customerName = computed(() => customerQuery.data.value?.name ?? 'This customer')

/** `isPending` is "nothing cached yet", so a revalidation never re-skeletons. */
const loading = computed(() => houseQuery.isPending.value)

/**
 * Counts, or null while they are still being read. A tab that showed `· 0`
 * before the answer came back would be stating something about the house.
 */
const roomCount = computed(() =>
  roomsQuery.isSuccess.value ? (roomsQuery.data.value?.length ?? 0) : null,
)

const installedCount = computed(() =>
  installedQuery.isSuccess.value ? (installedQuery.data.value ?? 0) : null,
)

// --- what he types and what it does -----------------------------------------

const visit = useVisitNotes(props.houseId)

/** The laptop says save state in the app bar, as every other desk screen does. */
const save = useSaveReporter()

watch(
  () => houseQuery.data.value,
  (house) => {
    if (!house) return
    visit.seed(toVisitNotes(house))
    visit.seedPin(toVisitPin(house))
  },
  { immediate: true },
)

watch(
  () => roomsQuery.data.value,
  (rooms) => {
    if (rooms) visit.seedRooms(rooms)
  },
  { immediate: true },
)

/**
 * A write that was refused is said; one that merely has not left the phone is
 * not an error, and the offline band is already saying it.
 */
watch(visit.refused, (bad) => (bad ? save.failed() : save.saved()))

/** Queued work goes the moment there is a connection to put it through. */
watch(online, (up, wasUp) => {
  if (up && wasUp === false) visit.retry()
})

/**
 * He has finished with a field. That is a better moment to send than any timer
 * can guess, so it goes now — and a chip beside the field is not leaving it,
 * since the chip's whole job is to type into the field he is still in.
 */
function onFieldExit(event: FocusEvent) {
  const next = event.relatedTarget as HTMLElement | null
  if (next?.closest('[data-phrases]')) return
  visit.flushNow()
}

// --- the pin ----------------------------------------------------------------

const pinFinding = ref(false)
const pinFailed = ref(false)

const CLOCK = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/**
 * `Drop a pin where I'm standing` — the phone's, and only the phone's.
 *
 * The position is written to `gps_lat` / `gps_lng`. The accuracy and the time
 * the browser hands over are shown and **not** written, because the house has
 * no column for either — so they survive until the page is reloaded and then
 * the row falls back to the coordinates alone. See `VisitPin`.
 *
 * Failure is not an error state: the pin is optional, so the screen says it
 * could not get one and that the directions are enough, and moves on.
 */
function dropPin() {
  if (pinFinding.value) return

  pinFailed.value = false

  if (!('geolocation' in navigator)) {
    pinFailed.value = true
    return
  }

  pinFinding.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords, timestamp }) => {
      pinFinding.value = false
      visit.setPin({
        lat: coords.latitude,
        lng: coords.longitude,
        // The device's own figure, rounded to the metre it is good to.
        accuracyM: Math.round(coords.accuracy),
        time: CLOCK.format(new Date(timestamp)),
      })
    },
    () => {
      pinFinding.value = false
      pinFailed.value = true
    },
    { enableHighAccuracy: true, timeout: 15_000 },
  )
}

function clearPin() {
  visit.setPin(null)
  pinFailed.value = false
}

// --- offline ----------------------------------------------------------------

/**
 * A2. The band goes up when the connection drops and is replaced by its own
 * ending when it comes back — the acknowledgement that what was held went.
 *
 * None of it gates anything: the fields below stay live throughout, which is
 * the whole point of the state.
 */
const reconnectedAt = ref<string | null>(null)
let settle: ReturnType<typeof setTimeout> | undefined

watch(online, (up, wasUp) => {
  if (!up) {
    reconnectedAt.value = null
    clearTimeout(settle)
    return
  }

  // Only if he actually watched it drop — a page that opens online has nothing
  // to say about having come back.
  if (wasUp === false) {
    reconnectedAt.value = CLOCK.format(new Date())
    // It is an acknowledgement, not a state: it says its piece and goes.
    settle = setTimeout(() => (reconnectedAt.value = null), 6000)
  }
})

onBeforeUnmount(() => clearTimeout(settle))

const showOffline = computed(() => !online.value || reconnectedAt.value !== null)

// --- where the screen leads -------------------------------------------------

const backToCustomer = computed(() => ({
  name: 'customer-detail',
  params: { id: props.customerId },
}))

/** The one button on A1: the next part of the walk, not a commit. */
const walkTheRooms = () =>
  router.push({
    name: 'house-rooms',
    params: { id: props.customerId, houseId: props.houseId },
  })
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <!-- === A1 / A2 — the visit === -->
    <template v-if="isPhone">
      <HouseVisitPhoneHeader
        :customer-name="customerName"
        :back-to="backToCustomer"
        :saved-label="visit.savedLabel.value"
        :offline="!online"
      />

      <HouseTabBar
        :customer-id="customerId"
        :house-id="houseId"
        :room-count="roomCount"
        :installed-count="installedCount"
        size="phone"
      />

      <VisitOfflineNotice
        v-if="showOffline"
        :note-count="visit.pendingNoteCount.value"
        :room-count="visit.pendingRoomCount.value"
        :held="visit.queue.value"
        :reconnected="reconnectedAt !== null"
        :sent-at="reconnectedAt ?? undefined"
      />

      <!-- A read that failed only takes the screen when there is nothing else
           to put there. With unsent work his own words are on it, and they are
           the ones he came back for. -->
      <SBanner
        v-if="houseQuery.isError.value && !visit.unsentWork.value"
        variant="error"
        class="failure"
      >
        Could not read this house.
      </SBanner>

      <HouseVisitSkeleton v-else-if="loading && !visit.unsentWork.value" size="phone" />

      <template v-else>
        <!-- Leaving a field is the natural moment to send it, and it is what
             lets the debounce behind this be generous. -->
        <HouseVisitPhone
          :draft="visit.draft"
          :pin="visit.pin.value"
          :pin-finding="pinFinding"
          :pin-failed="pinFailed"
          @focusout="onFieldExit"
          @drop-pin="dropPin"
          @clear-pin="clearPin"
        />
        <VisitFooterPhone @walk="walkTheRooms" />
      </template>
    </template>

    <!-- === A3 — the desk === -->
    <template v-else>
      <div class="head">
        <SText type="cell-meta" color="fg-2-soft">
          Customers ›
          <RouterLink :to="backToCustomer" class="crumb">{{ customerName }}</RouterLink>
          ›
        </SText>

        <div class="title-row">
          <!-- "Her house", never the address — the same on both devices. -->
          <SText type="display" as="h1" class="title">Her house</SText>
        </div>

        <HouseTabBar
          :customer-id="customerId"
          :house-id="houseId"
          :room-count="roomCount"
          :installed-count="installedCount"
          size="desk"
        />
      </div>

      <SBanner
        v-if="houseQuery.isError.value && !visit.unsentWork.value"
        variant="error"
        class="failure"
      >
        Could not read this house.
      </SBanner>

      <HouseVisitSkeleton v-else-if="loading && !visit.unsentWork.value" size="desk" />

      <HouseVisitDesk
        v-else
        :customer-id="customerId"
        :house-id="houseId"
        :draft="visit.draft"
        :pin="visit.pin.value"
        :rooms="visit.rooms.value"
        :rooms-loading="roomsQuery.isPending.value"
        :rooms-failed="roomsQuery.isError.value"
        :installed-count="installedCount"
        @focusout="onFieldExit"
        @clear-pin="clearPin"
        @cycle-room="visit.cycleRoom"
      />
    </template>
  </AppLayout>
</template>

<style scoped>
.head {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px 32px 0;
}

.title-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

/* The reference tracks the page title a touch looser than the display role's
   own -0.02em: at 32px it is a name, not a figure. */
.title {
  letter-spacing: -0.01em;
}

.crumb {
  color: var(--color-action-ink);
  text-decoration: none;
}

.crumb:hover {
  color: var(--color-action-ink);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.crumb:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}

.failure {
  margin: 20px 32px;
}

@media (max-width: 899px) {
  .failure {
    margin: 16px;
  }
}
</style>
