<script setup lang="ts">
import { ref } from 'vue'
import { SInput, SSegmented, STextarea } from '@/components/atoms'
import HouseInstalledCard from '@/components/house/HouseInstalledCard.vue'
import HouseRoomsCard from '@/components/house/HouseRoomsCard.vue'
import VisitBlockDesk from '@/components/house/VisitBlockDesk.vue'
import VisitPhraseChips from '@/components/house/VisitPhraseChips.vue'
import VisitPinDesk from '@/components/house/VisitPinDesk.vue'
import {
  ACCESS_PHRASES,
  ADDRESS_LABEL,
  ADDRESS_PLACEHOLDER,
  BLOCKS,
  DIRECTIONS_LABEL,
  WIRING_HELPER_DESK,
  WIRING_PHRASES,
} from '@/data/houseVisitCopy'
import {
  INTERNET_SEGMENTS,
  type VisitNotesDraft,
  type VisitPin,
  type VisitRoom,
} from '@/types/houseVisit'

/**
 * A3 — the same visit, back at the desk, before quoting.
 *
 * **Review, not capture.** Same fields, same words, same order as the phone;
 * nothing new is collected here. What changes is the shape: the labels move
 * into a left gutter so the four blocks read as a document he can scan for what
 * he skipped, and the rooms sit beside the notes so a guessed type gets
 * confirmed while he is reading the note that mentions it.
 *
 * Three things are deliberately absent, and their absence is the design: no
 * save button, no `Walk the rooms →` (that button is for moving through a
 * house, and he is not in one), and no way to drop a pin.
 */
defineProps<{
  customerId: number
  houseId: number
  draft: VisitNotesDraft
  pin: VisitPin | null
  rooms: VisitRoom[]
  installedCount: number
}>()

defineEmits<{ clearPin: []; cycleRoom: [roomId: number] }>()

const accessField = ref<InstanceType<typeof STextarea> | null>(null)
const wiringField = ref<InstanceType<typeof STextarea> | null>(null)
</script>

<template>
  <div class="body">
    <div class="document">
      <VisitBlockDesk v-bind="BLOCKS.finding">
        <!-- Three rows here rather than four: at the desk he is reading it back
             more often than writing it, and it grows by hand if he is not. -->
        <STextarea
          v-model="draft.directions"
          :label="DIRECTIONS_LABEL"
          :rows="3"
        />

        <!-- Side by side, equal columns: at this width the pin and the address
             are two short facts about where it is, not two steps. -->
        <div class="where">
          <VisitPinDesk :pin="pin" @clear="$emit('clearPin')" />
          <SInput
            v-model="draft.address"
            :label="ADDRESS_LABEL"
            :placeholder="ADDRESS_PLACEHOLDER"
          />
        </div>
      </VisitBlockDesk>

      <VisitBlockDesk v-bind="BLOCKS.access">
        <STextarea
          ref="accessField"
          v-model="draft.access"
          :rows="2"
          aria-label="Getting in"
        />
        <VisitPhraseChips
          :phrases="ACCESS_PHRASES"
          size="desk"
          @insert="accessField?.insert($event)"
        />
      </VisitBlockDesk>

      <VisitBlockDesk v-bind="BLOCKS.wiring" boxed :helper="WIRING_HELPER_DESK">
        <STextarea
          ref="wiringField"
          v-model="draft.wiring"
          :rows="2"
          aria-label="Wiring — the neutral"
        />
        <VisitPhraseChips
          :phrases="WIRING_PHRASES"
          size="desk"
          @insert="wiringField?.insert($event)"
        />
      </VisitBlockDesk>

      <VisitBlockDesk v-bind="BLOCKS.internet">
        <!-- The control and its note on one row: the value is four words wide
             and the note is a sentence, so stacking them would leave a hole. -->
        <div class="internet">
          <SSegmented
            v-model="draft.internet"
            :options="INTERNET_SEGMENTS"
            variant="joined"
            size="md"
          />
          <SInput v-model="draft.internetNote" aria-label="Internet, in detail" />
        </div>
      </VisitBlockDesk>
    </div>

    <div class="aside">
      <HouseRoomsCard
        :customer-id="customerId"
        :house-id="houseId"
        :rooms="rooms"
        @cycle="$emit('cycleRoom', $event)"
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

.document {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.where {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  /* End, not stretch: the address carries a label and the pin does not, so
     aligning their tops would put the two boxes on different lines. */
  align-items: end;
  gap: 12px;
}

/* The control is fixed at the width four words need; the note takes the rest. */
.internet {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/*
 * ⚠️ Not designed. Between the phone's breakpoint and the width the two columns
 * need, the aside drops under the document rather than squeezing the notes —
 * the notes are what the screen is for, and the rooms card reads the same at
 * full width.
 */
@media (max-width: 1100px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }

  .internet {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
