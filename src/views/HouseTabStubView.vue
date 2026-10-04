<script setup lang="ts">
import { computed } from 'vue'
import { SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import HouseTabBar from '@/components/house/HouseTabBar.vue'
import HouseVisitPhoneHeader from '@/components/house/HouseVisitPhoneHeader.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { useCustomer } from '@/api/hooks/customers'
import { visitContextMock } from '@/data/houseVisitMock'

/**
 * The house's other two tabs — Rooms (block B) and Installed (block C) — which
 * are designed elsewhere and out of scope here.
 *
 * It keeps the house's header and tab bar rather than being a bare page,
 * because the tabs are how he gets back: `Walk the rooms →` and `Edit rooms`
 * both land here, and a stub that dropped the chrome would strand him. The only
 * thing missing is the tab's own content.
 */
const props = defineProps<{
  customerId: number
  houseId: number
  tab: 'rooms' | 'installed'
}>()

const isPhone = useMediaQuery('(max-width: 899px)')
const online = useOnline()

const customerQuery = useCustomer(() => props.customerId)
const customerName = computed(() => customerQuery.data.value?.name ?? 'This customer')

const COPY = {
  rooms: {
    title: 'Rooms',
    block: 'block B',
    detail:
      'Every room in the house, named and typed, in the order he walks them — adding, renaming, removing and reordering. Visit notes confirms a guessed type and does nothing else to a room.',
  },
  installed: {
    title: 'Installed',
    block: 'block C',
    detail:
      'What has been put in, room by room, and what it is doing. Nothing is installed in a house that has only been visited.',
  },
} as const

const copy = computed(() => COPY[props.tab])

const backToVisit = computed(() => ({
  name: 'house-detail',
  params: { id: props.customerId, houseId: props.houseId },
}))
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <HouseVisitPhoneHeader
      v-if="isPhone"
      :customer-name="customerName"
      :back-to="{ name: 'customer-detail', params: { id: customerId } }"
      :saved-label="null"
      :offline="!online"
    />

    <div v-else class="head">
      <SText type="display" as="h1" class="title">Her house</SText>
    </div>

    <HouseTabBar
      :customer-id="customerId"
      :house-id="houseId"
      :room-count="visitContextMock.roomCount"
      :installed-count="visitContextMock.installedCount"
      :size="isPhone ? 'phone' : 'desk'"
      :class="isPhone ? undefined : 'desk-tabs'"
    />

    <div class="stub">
      <SText type="micro" color="micro">not in this handoff · {{ copy.block }}</SText>
      <SText type="title" as="h2">{{ copy.title }}</SText>
      <SText type="body" color="fg-2">{{ copy.detail }}</SText>
      <SButton
        variant="secondary"
        :size="isPhone ? 'lg' : 'md'"
        @click="$router.push(backToVisit)"
      >
        Back to visit notes
      </SButton>
    </div>
  </AppLayout>
</template>

<style scoped>
.head {
  padding: 24px 32px 14px;
}

.title {
  letter-spacing: -0.01em;
}

.desk-tabs {
  margin: 0 32px;
}

.stub {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 32px;
  max-width: 620px;
}

@media (max-width: 899px) {
  .stub {
    padding: 24px 16px;
  }
}
</style>
