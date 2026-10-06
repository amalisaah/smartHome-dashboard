<script setup lang="ts">
import { ref } from 'vue'
import { SInput, SText } from '@/components/atoms'
import CountStepper from '@/components/house/CountStepper.vue'
import {
  CANCEL,
  CATALOGUE_SEARCH_PHONE,
  COUNT_LABELS,
  COUNTS_ONLY_NOTE,
  correctingTitle,
  DONE,
  EXPLAINER_AFTER,
  EXPLAINER_BEFORE,
  EXPLAINER_TAG,
} from '@/data/installedCopy'
import type { CountField, InstalledRoom } from '@/types/installed'

/**
 * C2 — correcting one room's counts by hand, on the phone.
 *
 * The screen a house fitted before the app needs: nothing wrote this record, so
 * somebody has to, and `3 bulbs, 1 of them faulty` is the whole of what they
 * have to say. There is no unit, no serial and no "which one" — the note under
 * the search says so out loud, because it is the first question anybody asks.
 *
 * **No save button.** `Done` leaves the screen; the counts were kept as they
 * were tapped, and the app bar is where saving is reported.
 *
 * Rows open one at a time. Three steppers is a screen's worth of control, and
 * the room has more devices in it than that — a collapsed row says its count in
 * four characters and opens when it is the one being corrected.
 */
const props = defineProps<{
  room: InstalledRoom
  /**
   * Whether a step can be made at all. The API cannot empty a row or put one
   * back to `active`, so the last unit of a status has nowhere to go — the `−`
   * is inert there rather than failing after the press. See
   * `useHouseInstalledEditor`.
   */
  canStep: (deviceId: string, field: CountField, by: number) => boolean
}>()

defineEmits<{
  cancel: []
  done: []
  step: [deviceId: string, field: CountField, by: number]
}>()

/** Which row is open. One, because three steppers already fill the thumb's reach. */
const open = ref<string | null>(null)

const toggle = (id: string) => (open.value = open.value === id ? null : id)
</script>

<template>
  <div>
    <div class="bar">
      <button type="button" class="bar-action" @click="$emit('cancel')">{{ CANCEL }}</button>
      <SText type="screen-title" as="h1" color="inverse">
        {{ correctingTitle(room.name) }}
      </SText>
      <button
        type="button"
        class="bar-action bar-action--done"
        @click="$emit('done')"
      >
        {{ DONE }}
      </button>
    </div>

    <!-- Said before the first stepper is touched, because it is what the mark
         on the record will mean to whoever reads it next. -->
    <p class="explainer">
      {{ EXPLAINER_BEFORE }} <span class="tag">{{ EXPLAINER_TAG }}</span> {{ EXPLAINER_AFTER }}
    </p>

    <div v-for="device in room.devices" :key="device.id" class="device">
      <button
        type="button"
        class="device-head"
        :aria-expanded="open === device.id"
        @click="toggle(device.id)"
      >
        <SText type="list-title">{{ device.name }}</SText>
        <SText v-if="open !== device.id" type="list-meta">
          {{ device.active }} active
        </SText>
      </button>

      <div v-if="open === device.id" class="counts">
        <div
          v-for="field in ((['active', 'faulty', 'removed']) as CountField[])"
          :key="field"
          class="count"
        >
          <SText
            type="column-header"
            :color="field === 'faulty' ? 'risk' : 'fg-2-soft'"
          >
            {{ COUNT_LABELS[field] }}
          </SText>
          <CountStepper
            :model-value="device[field]"
            :label="`${COUNT_LABELS[field]}, ${device.name}`"
            :tone="field === 'faulty' ? 'risk' : field === 'removed' ? 'muted' : 'plain'"
            size="phone"
            :can-down="props.canStep(device.id, field, -1)"
            :can-up="props.canStep(device.id, field, 1)"
            @step="$emit('step', device.id, field, $event)"
          />
        </div>
      </div>
    </div>

    <div class="add">
      <!-- ⚠️ A stub. The catalogue's search results are out of this handoff's
           scope; the field is drawn and focuses, and picking an item from it is
           where block C meets the catalogue module. -->
      <SInput
        :model-value="''"
        :placeholder="CATALOGUE_SEARCH_PHONE"
        aria-label="Add from catalogue"
        size="phone"
        dashed
      />
      <SText type="caption" class="note">{{ COUNTS_ONLY_NOTE }}</SText>
    </div>
  </div>
</template>

<style scoped>
/* `--fg`, not the page: this is a mode he is inside, and the dark bar is what
   says so at a glance without a word for it. */
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-fg);
}

.bar-action {
  position: relative;
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: normal;
  color: var(--color-muted-dark);
  background: transparent;
  border: none;
  border-radius: var(--radius-flag);
  padding: 0 4px;
  flex: none;
  cursor: pointer;
  transition: color 120ms ease-out;
}

/* The drawn box is the bar's own 14px line and a thumb needs 48. The box keeps the height it is
   drawn at and the target is hung off it, rather than the strip growing to hold
   it — the same answer the house's tab bar and header link give. */
.bar-action::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}


/* The lifted action, because the drawn one disappears into a `--fg` ground. */
.bar-action--done {
  font-weight: 600;
  color: var(--color-action-on-dark);
}

.bar-action:hover {
  color: var(--color-inverse);
}

.bar-action--done:hover {
  color: var(--color-inverse);
}

.bar-action:focus-visible {
  outline: 2px solid var(--color-action-on-dark);
  outline-offset: 2px;
}

.explainer {
  margin: 0;
  padding: 12px 16px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-fg-2);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

/* The chip as it will appear on the record, drawn inside the sentence that
   explains it — so the thing being described is the thing being shown. */
.tag {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-flag);
  background: var(--color-bg);
  white-space: nowrap;
}

.device {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-divider);
}

.device-head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 0;
  font: inherit;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
}


/* The drawn box is the device name's own line and a thumb needs 48. The box keeps the height it is
   drawn at and the target is hung off it, rather than the strip growing to hold
   it — the same answer the house's tab bar and header link give. */
.device-head::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}

.device-head:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.counts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.count {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: stretch;
}

.add {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
}

.note {
  line-height: 1.5;
  text-wrap: pretty;
}
</style>
