<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCustomer, useHouse } from '@/api/hooks/customers'
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
import { useVisitNotes } from '@/composables/useVisitNotes'
import { visitContextMock, visitNotesMock } from '@/data/houseVisitMock'
import { nextRoomType, type VisitPin, type VisitRoom } from '@/types/houseVisit'
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
 * What the whole screen turns on: **there is no save button.** Every keystroke
 * is kept as it is typed, the header (phone) or the app bar (laptop) says where
 * it has got to, and losing the connection stops nothing — see `useVisitNotes`
 * for where the words actually go, and `visitContextMock` for what the screen
 * is handed rather than told.
 */
const props = defineProps<{ customerId: number; houseId: number }>()

const router = useRouter()
const isPhone = useMediaQuery('(max-width: 899px)')
const online = useOnline()

// Two reads, two fates. Losing her name costs the header its way back and
// nothing else; losing the house costs the fields their starting values. Neither
// holds up the other, and neither holds up a field he can type into.
const customerQuery = useCustomer(() => props.customerId)
const houseQuery = useHouse(
  () => props.customerId,
  () => props.houseId,
)

const customerName = computed(() => customerQuery.data.value?.name ?? 'This customer')

/** `isPending` is "nothing cached yet", so a revalidation never re-skeletons. */
const loading = computed(() => houseQuery.isPending.value)

/** A house id that is not one of hers. Said plainly; there is nothing to show. */
const missing = computed(() => !loading.value && houseQuery.data.value === null)

// --- what he types ----------------------------------------------------------

const { draft, savedLabel, seed } = useVisitNotes(props.houseId)

/**
 * The record's own values, once the read lands. `seed` ignores them if he has
 * already started typing — what is in front of him outranks what was stored.
 *
 * With no backend at all the mock stands in, so the frame can be seen and
 * compared against the reference.
 */
watch(
  () => houseQuery.data.value,
  (house) => {
    if (house) seed(toVisitNotes(house))
  },
  { immediate: true },
)

watch(
  () => houseQuery.isError.value,
  (failed) => {
    if (failed) seed({ ...visitNotesMock })
  },
  { immediate: true },
)

// --- the pin ----------------------------------------------------------------

/**
 * Where he was standing.
 *
 * The position is the record's; the accuracy and the time are **supplied**,
 * because `ApiHouse` has no column for either — a pin read back from the wire
 * knows where but not how sure or when. Rather than invent them, the supplied
 * reading stands in beside the real coordinates.
 *
 * TODO(api): once the house carries its own accuracy and timestamp, this
 * collapses to the mapper and `visitContextMock.pin` goes.
 */
const localPin = ref<VisitPin | null | undefined>(undefined)

const pin = computed<VisitPin | null>(() => {
  if (localPin.value !== undefined) return localPin.value

  const house = houseQuery.data.value
  if (!house) return houseQuery.isError.value ? visitContextMock.pin : null

  const position = toVisitPin(house)
  if (!position) return null

  const supplied = visitContextMock.pin
  return { ...position, accuracyM: supplied?.accuracyM ?? 0, time: supplied?.time ?? '' }
})

const pinFinding = ref(false)
const pinFailed = ref(false)

/**
 * `Drop a pin where I'm standing` — the phone's, and only the phone's.
 *
 * TODO(api): nothing is written. `PATCH /houses/{id}` would take `gps_lat` and
 * `gps_lng`, and has nowhere to put the accuracy or the time the row shows.
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
      localPin.value = {
        lat: coords.latitude,
        lng: coords.longitude,
        // The device's own figure, rounded to the metre it is good to.
        accuracyM: Math.round(coords.accuracy),
        time: CLOCK.format(new Date(timestamp)),
      }
    },
    () => {
      pinFinding.value = false
      pinFailed.value = true
    },
    { enableHighAccuracy: true, timeout: 15_000 },
  )
}

const CLOCK = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** TODO(api): clears it on screen only — see `dropPin`. */
function clearPin() {
  localPin.value = null
  pinFailed.value = false
}

// --- rooms ------------------------------------------------------------------

/**
 * The rooms as the card shows them. Supplied — including which types were
 * guessed, which this screen is told and never works out from a name.
 *
 * TODO(api): `GET /houses/{id}/composition` for the list, and a write for the
 * type a click settles. Held locally meanwhile so the one interaction A3 owns
 * actually answers.
 */
const rooms = ref<VisitRoom[]>(visitContextMock.rooms.map((room) => ({ ...room })))

function cycleRoom(roomId: number) {
  rooms.value = rooms.value.map((room) => (room.id === roomId ? nextRoomType(room) : room))
}

// --- offline ----------------------------------------------------------------

/**
 * A2. The banner goes up when the connection drops and is replaced by its own
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
        :saved-label="savedLabel"
        :offline="!online"
      />

      <HouseTabBar
        :customer-id="customerId"
        :house-id="houseId"
        :room-count="visitContextMock.roomCount"
        :installed-count="visitContextMock.installedCount"
        size="phone"
      />

      <VisitOfflineNotice
        v-if="showOffline"
        :note-count="visitContextMock.heldNoteCount"
        :room-count="visitContextMock.heldRoomCount"
        :held="visitContextMock.held"
        :reconnected="reconnectedAt !== null"
        :sent-at="reconnectedAt ?? undefined"
      />

      <SBanner v-if="missing" variant="error" class="failure">
        This house is not on her record.
      </SBanner>

      <HouseVisitSkeleton v-else-if="loading" size="phone" />

      <template v-else>
        <HouseVisitPhone
          :draft="draft"
          :pin="pin"
          :pin-finding="pinFinding"
          :pin-failed="pinFailed"
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
          <SText type="list-meta">{{ visitContextMock.visitSummary }}</SText>
        </div>

        <HouseTabBar
          :customer-id="customerId"
          :house-id="houseId"
          :room-count="visitContextMock.roomCount"
          :installed-count="visitContextMock.installedCount"
          size="desk"
        />
      </div>

      <SBanner v-if="missing" variant="error" class="failure">
        This house is not on her record.
      </SBanner>

      <HouseVisitSkeleton v-else-if="loading" size="desk" />

      <HouseVisitDesk
        v-else
        :customer-id="customerId"
        :house-id="houseId"
        :draft="draft"
        :pin="pin"
        :rooms="rooms"
        :installed-count="visitContextMock.installedCount"
        @clear-pin="clearPin"
        @cycle-room="cycleRoom"
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
