<script setup lang="ts">
import { ref } from 'vue'
import { SInput, SSegmented, STextarea } from '@/components/atoms'
import VisitBlockPhone from '@/components/house/VisitBlockPhone.vue'
import VisitPhraseChips from '@/components/house/VisitPhraseChips.vue'
import VisitPinPhone from '@/components/house/VisitPinPhone.vue'
import {
  ACCESS_PHRASES,
  ADDRESS_LABEL,
  ADDRESS_PLACEHOLDER,
  BLOCKS,
  DIRECTIONS_LABEL,
  WIRING_HELPER_PHONE,
  WIRING_PHRASES,
} from '@/data/houseVisitCopy'
import { INTERNET_SEGMENTS, type VisitNotesDraft, type VisitPin } from '@/types/houseVisit'

/**
 * A1 — the visit itself, as one scroll he fills in standing in her house, one
 * handed.
 *
 * The order is the order he meets things: the gate, then inside, then a wall
 * box, then the back of the house. That is why there are no sections to choose
 * between and no sub-navigation — the scroll *is* the walk, and anything that
 * made him pick where to go next would be slower than the notebook this has to
 * beat.
 *
 * Directions is the biggest field and the first on screen, because it is the
 * one that gets him back here. The address is one optional line under the pin:
 * present, never primary — most of these houses do not have one that a driver
 * could use.
 */
defineProps<{
  draft: VisitNotesDraft
  pin: VisitPin | null
  pinFinding?: boolean
  pinFailed?: boolean
}>()

defineEmits<{ dropPin: []; clearPin: [] }>()

/**
 * The two fields a chip types into. The chip hands its words to the field, and
 * the field decides where they land — at the caret, or appended if he has not
 * been in it yet.
 */
const accessField = ref<InstanceType<typeof STextarea> | null>(null)
const wiringField = ref<InstanceType<typeof STextarea> | null>(null)
</script>

<template>
  <div class="blocks">
    <VisitBlockPhone v-bind="BLOCKS.finding">
      <!-- Four rows: it is the field this screen is mostly about, and it has to
           look like somewhere a paragraph goes. -->
      <STextarea
        v-model="draft.directions"
        :label="DIRECTIONS_LABEL"
        label-size="md"
        size="phone"
        :rows="4"
      />

      <VisitPinPhone
        :pin="pin"
        :finding="pinFinding"
        :failed="pinFailed"
        @drop="$emit('dropPin')"
        @clear="$emit('clearPin')"
      />

      <SInput
        v-model="draft.address"
        :label="ADDRESS_LABEL"
        :placeholder="ADDRESS_PLACEHOLDER"
        size="phone"
      />
    </VisitBlockPhone>

    <VisitBlockPhone v-bind="BLOCKS.access">
      <STextarea
        ref="accessField"
        v-model="draft.access"
        size="phone"
        :rows="3"
        aria-label="Getting in"
      />
      <VisitPhraseChips
        :phrases="ACCESS_PHRASES"
        size="phone"
        @insert="accessField?.insert($event)"
      />
    </VisitBlockPhone>

    <!-- The only boxed block on the screen, on both devices. -->
    <VisitBlockPhone v-bind="BLOCKS.wiring" boxed :helper="WIRING_HELPER_PHONE">
      <STextarea
        ref="wiringField"
        v-model="draft.wiring"
        size="phone"
        :rows="3"
        aria-label="Wiring — the neutral"
      />
      <VisitPhraseChips
        :phrases="WIRING_PHRASES"
        size="phone"
        @insert="wiringField?.insert($event)"
      />
    </VisitBlockPhone>

    <VisitBlockPhone v-bind="BLOCKS.internet">
      <!-- Four fixed values, one tap. Exactly one is always selected, so there
           is no empty state to design: a house nobody has asked about is
           `unknown`, which is an answer. -->
      <SSegmented
        v-model="draft.internet"
        :options="INTERNET_SEGMENTS"
        variant="joined"
        size="lg"
      />
      <SInput v-model="draft.internetNote" size="phone" aria-label="Internet, in detail" />
    </VisitBlockPhone>
  </div>
</template>

<style scoped>
.blocks {
  display: flex;
  flex-direction: column;
}
</style>
