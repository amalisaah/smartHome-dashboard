<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import {
  PIN_DROP,
  PIN_DROP_OPTIONAL,
  PIN_FAILED,
  PIN_FINDING,
  PIN_SET_TITLE,
} from '@/data/houseVisitCopy'
import type { VisitPin } from '@/types/houseVisit'
import { formatAccuracy, formatCoords } from '@/utils/format'

/**
 * Where he is standing, dropped from the phone — the one thing on this screen
 * the laptop cannot do.
 *
 * **The pin is always optional.** It is offered below the directions, never
 * above them, and when it cannot be got the screen says so and then says the
 * directions are enough — which is true: a driver is given words, not
 * coordinates.
 */
defineProps<{
  pin: VisitPin | null
  /** The browser has been asked and has not answered yet. */
  finding?: boolean
  /** Permission refused, or no fix. Said under the button, not as a banner. */
  failed?: boolean
}>()

defineEmits<{ drop: []; clear: [] }>()
</script>

<template>
  <div v-if="pin" class="pin">
    <span class="dot" aria-hidden="true" />
    <span class="what">
      <SText type="ui">{{ PIN_SET_TITLE }}</SText>
      <!-- The reading, whole: where, how sure, and when. Without the accuracy a
           coordinate claims a precision the phone did not have. -->
      <SText type="cell-meta" class="reading">
        {{ formatCoords(pin.lat, pin.lng) }} · {{ formatAccuracy(pin.accuracyM) }} ·
        {{ pin.time }}
      </SText>
    </span>
    <SButton variant="ghost" size="md" @click="$emit('clear')">Clear</SButton>
  </div>

  <div v-else class="drop">
    <SButton
      variant="secondary"
      size="phone-wide"
      class="drop-button"
      :disabled="finding"
      @click="$emit('drop')"
    >
      <template v-if="finding">{{ PIN_FINDING }}</template>
      <template v-else>
        {{ PIN_DROP }}
        <SText type="cell-meta">{{ PIN_DROP_OPTIONAL }}</SText>
      </template>
    </SButton>

    <!-- It failed, and it did not matter. Said where it happened. -->
    <SText v-if="failed && !finding" type="meta">{{ PIN_FAILED }}</SText>
  </div>
</template>

<style scoped>
.pin {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  min-height: var(--hit-min);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
}

.dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: var(--radius-pill);
  background: var(--color-action);
}

.what {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

/* It is one reading, so it breaks as one or not at all. */
.reading {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drop {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drop-button {
  width: 100%;
}
</style>
