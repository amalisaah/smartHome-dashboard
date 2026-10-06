<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useHouseRooms, useInstalledGroups } from '@/api/hooks/houses'
import AppLayout from '@/components/app/AppLayout.vue'
import InstalledCorrectPhone from '@/components/house/InstalledCorrectPhone.vue'
import { useHouseInstalledEditor } from '@/composables/useHouseInstalledEditor'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { toInstalledRooms } from '@/utils/mapper/installedMapper'

/**
 * C2 — correcting one room's counts by hand, on the phone.
 *
 * It has its own address for the same reason the item form does: the back
 * gesture then closes the correction rather than leaving the house, and
 * `Cancel` and the system back button do the same thing. `Done` is the same
 * navigation — the counts were kept as they were tapped, so leaving is all
 * either word can mean.
 *
 * It is the **phone's** screen only. At the desk, correcting is a mode of C3's
 * table and not a place, so a window widened past the breakpoint while this is
 * open lands on the Installed tab, which is where correcting happens there.
 */
const props = defineProps<{ customerId: number; houseId: number; roomId: number }>()

const router = useRouter()
const isPhone = useMediaQuery('(max-width: 899px)')

const roomsQuery = useHouseRooms(() => props.houseId)
const installedQuery = useInstalledGroups(() => props.houseId)

const record = computed(() =>
  toInstalledRooms(roomsQuery.data.value ?? [], installedQuery.data.value ?? []),
)

const installed = useHouseInstalledEditor(props.houseId)

watch(record, (next) => installed.seed(next), { immediate: true })

const room = computed(
  () => installed.rooms.value.find((candidate) => candidate.id === props.roomId) ?? null,
)

/** Still reading. A room that is not here yet is not a room that is gone. */
const loading = computed(() => roomsQuery.isPending.value || installedQuery.isPending.value)

const installedTab = computed(() => ({
  name: 'house-installed',
  params: { id: props.customerId, houseId: props.houseId },
}))

const close = () => router.push(installedTab.value)

/** The desk has no such screen, and a room that is gone has nothing to correct. */
watch(
  [isPhone, room, loading],
  ([phone, found, reading]) => {
    if (!phone || (!found && !reading)) router.replace(installedTab.value)
  },
  { immediate: true },
)
</script>

<template>
  <AppLayout :chrome="false">
    <InstalledCorrectPhone
      v-if="room && isPhone"
      :room="room"
      :can-step="installed.canStep"
      @cancel="close"
      @done="close"
      @step="installed.step"
    />
  </AppLayout>
</template>
