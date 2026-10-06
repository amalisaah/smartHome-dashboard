<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import CountStepper from '@/components/house/CountStepper.vue'
import InstalledFault from '@/components/house/InstalledFault.vue'
import WrittenByChip from '@/components/house/WrittenByChip.vue'
import { COUNT_LABELS } from '@/data/installedCopy'
import { isRemovedOnly, type CountField, type InstalledDevice } from '@/types/installed'

/**
 * One device line, in both of the table's modes.
 *
 * It is one row and not two because that is the whole point of C3: `Correct by
 * hand` does not open a screen, it turns these three figures into three
 * steppers **in place**, so the thing being corrected never moves and the
 * column it belongs to never changes. A second component for the second mode
 * would be two rows that have to be kept looking identical by hand.
 *
 * Read mode's zeroes are `—` rather than `0`: a column of zeroes reads as a
 * measurement, and nobody measured these. Correction mode's are `0`, except
 * removed — a stepper has to show the number it is stepping, and removed starts
 * from nothing often enough that a dash is the honest resting state.
 */
const props = defineProps<{
  device: InstalledDevice
  correcting: boolean
  /**
   * Whether a step can be made at all. The API cannot empty a row or put one
   * back to `active`, so the last unit of a status has nowhere to go — the `−`
   * is inert there rather than failing after the press. See
   * `useHouseInstalledEditor`.
   */
  canStep: (deviceId: string, field: CountField, by: number) => boolean
}>()

defineEmits<{ step: [field: CountField, by: number] }>()

/** A line nobody has any of any more. Struck through, and quiet. */
const gone = computed(() => isRemovedOnly(props.device))
</script>

<template>
  <div class="row">
    <div class="what">
      <SText type="cell" :color="gone ? 'micro' : undefined" :class="{ gone }">
        {{ device.name }}
      </SText>
      <InstalledFault :pill="device.faultPill" :note="device.faultNote" />
      <SText v-if="gone && device.removedNote" type="cell-meta" color="micro">
        {{ device.removedNote }}
      </SText>
    </div>

    <template v-if="correcting">
      <CountStepper
        :model-value="device.active"
        :label="`${COUNT_LABELS.active}, ${device.name}`"
        :can-down="props.canStep(device.id, 'active', -1)"
        :can-up="props.canStep(device.id, 'active', 1)"
        @step="$emit('step', 'active', $event)"
      />
      <CountStepper
        :model-value="device.faulty"
        :label="`${COUNT_LABELS.faulty}, ${device.name}`"
        tone="risk"
        :can-down="props.canStep(device.id, 'faulty', -1)"
        :can-up="props.canStep(device.id, 'faulty', 1)"
        @step="$emit('step', 'faulty', $event)"
      />
      <CountStepper
        :model-value="device.removed"
        :label="`${COUNT_LABELS.removed}, ${device.name}`"
        tone="muted"
        dash-at-zero
        :can-down="props.canStep(device.id, 'removed', -1)"
        :can-up="props.canStep(device.id, 'removed', 1)"
        @step="$emit('step', 'removed', $event)"
      />
    </template>

    <template v-else>
      <span class="count count--active">{{ device.active }}</span>
      <span v-if="device.faulty > 0" class="count count--faulty">{{ device.faulty }}</span>
      <span v-else class="count count--none">—</span>
      <span v-if="device.removed > 0" class="count count--removed">{{ device.removed }}</span>
      <span v-else class="count count--nil">—</span>
    </template>

    <WrittenByChip :source="device.source" :date="device.sourceDate" />
  </div>
</template>

<style scoped>
/* The same five tracks as the column header and every other row, declared here
   rather than inherited, because a row is a grid in its own right and a
   subgrid would make the stepper's height the room group's business. */
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px 120px 120px 150px;
  gap: 16px;
  align-items: center;
  padding: 6px 12px;
  min-height: 36px;
}

/* Indented from the room name above it, so the group reads as a room with
   things in it rather than as a flat list that happens to have headings. */
.what {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding-left: 14px;
}

.gone {
  text-decoration: line-through;
}

.count {
  text-align: center;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.count--active {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-fg);
}

/* The only amber figure on the page. */
.count--faulty {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-risk);
}

.count--removed {
  font-size: 13px;
  color: var(--color-fg-2);
}

/* Two dashes, two inks. The faulty column's sits where a warning would, so it
   is the quieter of the two "nothing here"s; the removed column's is a fact
   about the past and takes the micro ink the footer does. */
.count--none {
  font-size: 13px;
  color: var(--color-fg-3);
}

.count--nil {
  font-size: 13px;
  color: var(--color-micro);
}
</style>
