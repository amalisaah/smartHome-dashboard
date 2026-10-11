<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import InstalledBeforeYouTouch from '@/components/house/InstalledBeforeYouTouch.vue'
import InstalledPhoneRoom from '@/components/house/InstalledPhoneRoom.vue'
import RoomsSkeleton from '@/components/house/RoomsSkeleton.vue'
import { SBanner } from '@/components/atoms'
import {
  activeCount,
  CORRECT_BY_HAND,
  faultyCount,
  removedToggle,
  writtenByJobs,
} from '@/data/installedCopy'
import type { BeforeYouTouch, InstalledRoom, InstalledTotals } from '@/types/installed'

/**
 * C1 — what is installed, read before touching a switch.
 *
 * Written for someone who has never been in the building and is reading it a
 * year from now, which is why it reads top to bottom as a briefing rather than
 * as a table: what you need to know before you start, then what the totals are,
 * then the rooms in the order you walk them.
 *
 * **Jobs write this screen.** Correcting it by hand is demoted to a text link
 * in the footer, because a hand-typed count is the exception and the footer is
 * where the screen says who wrote it.
 */
const props = defineProps<{
  customerId: number
  houseId: number
  rooms: readonly InstalledRoom[]
  totals: InstalledTotals
  facts: BeforeYouTouch
  /** Null until a job has written anything here. */
  lastJobDate: string | null
  showRemoved: boolean
  loading?: boolean
  failed?: boolean
}>()

defineEmits<{ toggleRemoved: []; correct: [roomId: number] }>()

/** The whole-house group has no room to correct, so it is not a door. */
const roomDoor = (id: number | null) => id

/**
 * Where the footer's `Correct by hand` goes. The first room of the walk, which
 * is where the walk starts; the whole-house group is skipped because there is
 * no room of it to correct.
 */
const firstRoom = computed(
  () => props.rooms.find((room) => room.id !== null)?.id ?? null,
)
</script>

<template>
  <div>
    <InstalledBeforeYouTouch
      :facts="facts"
      :customer-id="customerId"
      :house-id="houseId"
      size="phone"
    />

    <div class="summary">
      <SText type="list-meta" color="fg-2">
        {{ activeCount(totals.active) }} ·
        <span class="faulty">{{ faultyCount(totals.faulty) }}</span>
      </SText>
      <button
        v-if="totals.removed > 0"
        type="button"
        class="toggle"
        @click="$emit('toggleRemoved')"
      >
        {{ removedToggle(showRemoved, totals.removed) }}
      </button>
    </div>

    <!-- Tapping a room is the other way into correcting it, and the one that
         answers "this room" without a second question. -->
    <SBanner v-if="failed" variant="error" class="failure">
      Could not read what is installed here.
    </SBanner>

    <RoomsSkeleton v-else-if="loading" size="phone" :rows="5" />

    <template v-for="room in rooms" v-else :key="room.id ?? 'whole-house'">
      <button
        v-if="roomDoor(room.id) !== null"
        type="button"
        class="room-door"
        :aria-label="`Correct ${room.name} by hand`"
        @click="$emit('correct', room.id as number)"
      >
        <InstalledPhoneRoom :room="room" :show-removed="showRemoved" />
      </button>
      <!-- Whole-house equipment belongs to no room, so there is no room of it
           to correct and the group is read-only here. -->
      <InstalledPhoneRoom v-else :room="room" :show-removed="showRemoved" />
    </template>

    <div class="footer">
      <SText type="cell-meta" color="fg-2-soft">{{ writtenByJobs(lastJobDate) }}</SText>
      <button
        v-if="firstRoom !== null"
        type="button"
        class="correct"
        @click="$emit('correct', firstRoom as number)"
      >
        {{ CORRECT_BY_HAND }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-line);
}

/* The one amber figure in the strip, weighted because it is the half of the
   sentence somebody is going to act on. */
.faulty {
  color: var(--color-risk);
  font-weight: 600;
}

.toggle {
  position: relative;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-action-ink);
  background: transparent;
  border: none;
  border-radius: var(--radius-flag);
  min-height: 40px;
  padding: 0 4px;
  flex: none;
  cursor: pointer;
}

/* The drawn box is 40px and a thumb needs 48. The box keeps the height it is
   drawn at and the target is hung off it, rather than the strip growing to hold
   it — the same answer the house's tab bar and header link give. */
.toggle::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}


.toggle:hover,
.correct:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.toggle:focus-visible,
.correct:focus-visible,
.room-door:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.failure {
  margin: 16px;
}

/* The room is a door, and the button is only what makes it one: it contributes
   no box, no ground and no padding of its own. */
.room-door {
  display: block;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
}

.correct {
  position: relative;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-action-ink);
  background: transparent;
  border: none;
  border-radius: var(--radius-flag);
  min-height: 44px;
  padding: 0 4px;
  flex: none;
  cursor: pointer;
}

/* The drawn box is 44px and a thumb needs 48. The box keeps the height it is
   drawn at and the target is hung off it, rather than the strip growing to hold
   it — the same answer the house's tab bar and header link give. */
.correct::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}

</style>
