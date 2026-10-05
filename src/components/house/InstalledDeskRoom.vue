<script setup lang="ts">
import { computed } from 'vue'
import { SInput, SText } from '@/components/atoms'
import InstalledDeskRow from '@/components/house/InstalledDeskRow.vue'
import {
  activeCount,
  catalogueSearchDesk,
  NOTHING_INSTALLED,
  NOTHING_INSTALLED_META,
} from '@/data/installedCopy'
import { spaceLabel } from '@/types/houseVisit'
import {
  isRemovedOnly,
  roomActive,
  roomHasFault,
  roomIsEmpty,
  type CountField,
  type InstalledRoom,
} from '@/types/installed'

/**
 * One room as a group of rows — a heading, its devices, and a rule under it.
 *
 * The heading row is where the amber tint goes when something in the room is
 * faulty, so the room he is going to is found by running an eye down the left
 * edge rather than by reading the faulty column.
 *
 * **Removed lines are off by default and always on in correction mode.** They
 * have to be visible there because correcting a swap means moving a count out
 * of one line and into another, and a line he cannot see is a line he cannot
 * move a count into.
 */
const props = defineProps<{
  room: InstalledRoom
  showRemoved: boolean
  correcting: boolean
}>()

defineEmits<{ step: [deviceId: number, field: CountField, by: number] }>()

const faulted = computed(() => roomHasFault(props.room))
const empty = computed(() => roomIsEmpty(props.room))

const devices = computed(() =>
  props.room.devices.filter(
    (device) => !isRemovedOnly(device) || props.showRemoved || props.correcting,
  ),
)

/** `bedroom · 4 active`, or `bedroom · nothing installed`. */
const meta = computed(() =>
  `${spaceLabel(props.room.type)} · ${
    empty.value ? NOTHING_INSTALLED_META : activeCount(roomActive(props.room))
  }`,
)
</script>

<template>
  <section class="group">
    <div class="head" :class="{ 'head--fault': faulted }">
      <SText type="pane-title" as="h3">{{ room.name }}</SText>
      <SText type="cell-meta" color="fg-2-soft">{{ meta }}</SText>
    </div>

    <div v-if="empty" class="empty">
      <SText type="meta" color="fg-2-soft" class="empty-box">{{ NOTHING_INSTALLED }}</SText>
    </div>

    <InstalledDeskRow
      v-for="device in devices"
      :key="device.id"
      :device="device"
      :correcting="correcting"
      @step="(field, by) => $emit('step', device.id, field, by)"
    />

    <!-- ⚠️ A stub. The catalogue's search results are out of this handoff's
         scope; the field is drawn, focuses and firms as specified, and picking
         an item is where block C meets the catalogue module. -->
    <div v-if="correcting" class="add">
      <SInput
        :model-value="''"
        :placeholder="catalogueSearchDesk(room.name)"
        :aria-label="`Add to ${room.name} from catalogue`"
        size="split"
        dashed
        class="search"
      />
    </div>

    <!-- Read mode closes a group with air; correction mode closes it with the
         field that adds to it, which is the same job done by a control. -->
    <div v-else class="tail" />
  </section>
</template>

<style scoped>
.group {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--color-line);
}

.head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 14px 12px 6px;
}

/* The one row-level amber on the page: a room with something wrong in it. */
.head--fault {
  background: var(--color-row-risk-tint);
}

.empty {
  padding: 4px 12px 14px;
}

/* Dashed, because nothing being here is the system's observation rather than
   something he set. */
.empty-box {
  display: inline-block;
  padding: 8px 10px;
  border: 1px dashed var(--color-fg-3);
  border-radius: var(--radius-chip);
}

.add {
  padding: 4px 12px 12px 26px;
}

/* Fixed, not fluid: a search that grew with the table would read as a column. */
.search {
  width: 360px;
  max-width: 100%;
}

.tail {
  height: 8px;
}
</style>
