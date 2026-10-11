<script setup lang="ts">
import { computed, ref } from 'vue'
import { SInput, SSelect, SText, STextarea } from '@/components/atoms'
import { INTERNET_QUALITY_OPTIONS, parseGps, type HouseDraft } from '@/types/house'

/**
 * Everything a house knows about itself, in the order a visit turns it up:
 * what it is called, where it is, how to get in, what the site is like.
 *
 * Grouped rather than listed, because ten fields in a column is a wall. The
 * groups are not sections of a record — the record is flat — they are the four
 * questions he answers standing in her compound.
 *
 * Nothing is required: `POST /customers/{id}/houses` requires nothing, and what
 * is known on the day depends on whether anyone has been yet.
 */
const props = defineProps<{
  draft: HouseDraft
  /** `phone` is the 48px door; `md` the laptop's. */
  size?: 'phone' | 'md'
  disabled?: boolean
}>()

const fieldSize = computed(() => props.size ?? 'md')

/** Shown once he has left the field, so it does not accuse him mid-paste. */
const gpsTouched = ref(false)

const gpsInvalid = computed(
  () => gpsTouched.value && parseGps(props.draft.gps) === 'invalid',
)

const labelField = ref<InstanceType<typeof SInput> | null>(null)
defineExpose({ focus: () => labelField.value?.focus() })
</script>

<template>
  <div class="groups">
    <section class="group">
      <SText type="micro" color="micro" as="h2">What to call it</SText>
      <SInput
        ref="labelField"
        v-model="draft.label"
        label="Name"
        :size="fieldSize"
        label-size="md"
        :disabled="disabled"
        placeholder="Spintex house"
      />
    </section>

    <section class="group">
      <SText type="micro" color="micro" as="h2">Where it is</SText>
      <SInput
        v-model="draft.addressText"
        label="Address"
        :size="fieldSize"
        :disabled="disabled"
        placeholder="House 14, off Spintex Road"
      />
      <!-- The spec calls this the field that matters in practice, and it is
           prose, so it gets room to be prose. -->
      <STextarea
        v-model="draft.landmarkDirections"
        label="Directions"
        :rows="2"
        :disabled="disabled"
        placeholder="Right at the Shell station, blue gate after the junction, third house on the left"
      />
      <!-- One field, because a map hands over the pair and he pastes the pair. -->
      <SInput
        v-model="draft.gps"
        label="GPS · optional"
        :size="fieldSize"
        mono
        :disabled="disabled"
        placeholder="5.6295, -0.1712"
        :error="gpsInvalid"
        error-message="Two numbers, as a map gives them — latitude, then longitude."
        caption="Paste it from a map."
        @focusout="gpsTouched = true"
      />
    </section>

    <section class="group">
      <SText type="micro" color="micro" as="h2">Getting in</SText>
      <STextarea
        v-model="draft.accessNotes"
        label="Access"
        :rows="2"
        :disabled="disabled"
        placeholder="Dog in the compound, chained during the day. Security man until 6pm."
      />
    </section>

    <section class="group">
      <SText type="micro" color="micro" as="h2">What the site is like</SText>
      <!-- Expensive to learn and never learned twice, so it is asked here rather
           than left to be rediscovered on the next visit. -->
      <STextarea
        v-model="draft.wiringNotes"
        label="Wiring"
        :rows="2"
        :disabled="disabled"
        placeholder="Neutral wire in the wall boxes? Conduit accessible?"
        caption="Above all, whether the wall boxes have a neutral — it decides whether smart switches are possible at all."
      />
      <SSelect
        v-model="draft.internetQuality"
        label="Internet"
        :options="INTERNET_QUALITY_OPTIONS"
        :size="fieldSize === 'phone' ? 'lg' : 'md'"
        :disabled="disabled"
      />
      <SInput
        v-model="draft.internetNotes"
        label="Internet, in detail · optional"
        :size="fieldSize"
        :disabled="disabled"
        placeholder="4G router in the hall, drops most evenings"
      />
    </section>

    <section class="group">
      <SText type="micro" color="micro" as="h2">Anything else</SText>
      <STextarea
        v-model="draft.notes"
        label="Notes"
        :rows="2"
        :disabled="disabled"
        placeholder="Wants the compound lighting done next, budget permitting."
      />
    </section>
  </div>
</template>

<style scoped>
.groups {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
