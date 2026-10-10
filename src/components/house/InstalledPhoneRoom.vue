<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import InstalledFault from '@/components/house/InstalledFault.vue'
import { NOTHING_INSTALLED } from '@/data/installedCopy'
import { spaceLabel } from '@/types/houseVisit'
import { isRemovedOnly, roomHasFault, roomIsEmpty, type InstalledRoom } from '@/types/installed'

/**
 * One room of the record, read standing in a doorway.
 *
 * **A room with a fault takes the amber tint,** which is how the room he came
 * for is found by thumbing down the list rather than by reading every line.
 *
 * **An empty room stays visible.** Its name goes quiet over a dashed box
 * saying `Nothing installed` — dashed because the blank is the system's
 * observation rather than something he set, and visible because that blank is
 * the upgrade conversation.
 *
 * **Removed lines sit in their own room,** struck through, hidden until asked
 * for. Keeping them here rather than in a list of their own is what makes
 * "there used to be a 10A plug in the master" answerable at the plug socket.
 */
const props = defineProps<{ room: InstalledRoom; showRemoved: boolean }>()

const faulted = computed(() => roomHasFault(props.room))
const empty = computed(() => roomIsEmpty(props.room))

const present = computed(() => props.room.devices.filter((device) => !isRemovedOnly(device)))
const removed = computed(() => props.room.devices.filter(isRemovedOnly))

/**
 * `2×` — the count is what the line is about, so it is mono and it leads.
 *
 * It is the active count. A faulty unit is counted in the faulty column, not
 * folded back into this one: the reference's master bulb reads `2×` beside a
 * pill saying one of them is faulty, and the room above it totals 4.
 */
const times = (device: { active: number }) => `${device.active}×`
</script>

<template>
  <section class="room" :class="{ 'room--fault': faulted }">
    <div class="head">
      <SText type="screen-title" as="h3" :color="empty ? 'fg-2' : undefined">
        {{ room.name }}
      </SText>
      <SText v-if="room.type" type="cell-meta" color="fg-2-soft">
        {{ spaceLabel(room.type) }}
      </SText>
    </div>

    <SText v-if="empty" type="cell" color="fg-2-soft" class="empty">
      {{ NOTHING_INSTALLED }}
    </SText>

    <div v-for="device in present" :key="device.id" class="line">
      <span class="times">{{ times(device) }}</span>
      <span class="what">
        <span class="name">{{ device.name }}</span>
        <InstalledFault :pill="device.faultPill" :note="device.faultNote" size="phone" />
      </span>
    </div>

    <template v-if="showRemoved">
      <div v-for="device in removed" :key="device.id" class="line line--removed">
        <span class="times">{{ device.removed }}×</span>
        <span class="what">
          <span class="name">{{ device.name }}</span>
          <SText v-if="device.removedNote" type="cell-meta" color="fg-3">
            {{ device.removedNote }}
          </SText>
        </span>
      </div>
    </template>
  </section>
</template>

<style scoped>
.room {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-line);
}

.room--fault {
  background: var(--color-row-risk-tint);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

/* Dashed, because nothing being here is the system's observation rather than
   something he set. Inline-start so the box is the width of its own sentence. */
.empty {
  align-self: flex-start;
  padding: 8px 10px;
  border: 1px dashed var(--color-fg-3);
  border-radius: var(--radius-chip);
}

.line {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 15px;
}

.times {
  width: 28px;
  flex: none;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.what {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.name {
  text-wrap: pretty;
}

/* Struck through, quiet and a size down: it is in the record because it was
   here, not because it is. */
.line--removed {
  font-size: 14px;
  color: var(--color-fg-3);
}

.line--removed .times,
.line--removed .name {
  text-decoration: line-through;
}
</style>
