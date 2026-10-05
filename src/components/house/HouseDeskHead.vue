<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { SText } from '@/components/atoms'
import HouseTabBar from '@/components/house/HouseTabBar.vue'

/**
 * The laptop's head, identical on all three of the house's tabs: the way back
 * to her, what the screen is called, one mono line about the record, and the
 * tabs.
 *
 * **"Her house", never the address** — the same on the laptop as on the phone.
 * The address lives inside Visit notes, as a field; a screen named after a
 * location tells anyone glancing at the laptop where she lives.
 *
 * The summary phrase is the tab's own and is supplied: Rooms dates the visit,
 * Installed dates the last job. It is omitted rather than invented on a tab
 * with nothing to say about the record.
 */
const props = defineProps<{
  customerId: number
  houseId: number
  customerName: string
  roomCount: number | null
  installedCount: number | null
  /** `customer since Aug 2026 · last job 14 Aug`. Supplied. */
  summary?: string | null
}>()

const backToCustomer = computed(() => ({
  name: 'customer-detail',
  params: { id: props.customerId },
}))
</script>

<template>
  <div class="head">
    <div class="crumbs">
      <SText type="cell-meta" color="fg-2-soft">
        Customers ›
        <RouterLink :to="backToCustomer" class="crumb">{{ customerName }}</RouterLink>
        ›
      </SText>

      <div class="title-row">
        <SText type="display" as="h1" class="title">Her house</SText>
        <SText v-if="summary" type="list-meta">{{ summary }}</SText>
      </div>
    </div>

    <HouseTabBar
      :customer-id="customerId"
      :house-id="houseId"
      :room-count="roomCount"
      :installed-count="installedCount"
      size="desk"
    />
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px 32px 0;
}

.crumbs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

/* The reference tracks the page title a touch looser than the display role's
   own -0.02em: at 32px it is a name, not a figure. */
.title {
  letter-spacing: -0.01em;
}

.crumb {
  color: var(--color-action-ink);
  text-decoration: none;
}

.crumb:hover {
  color: var(--color-action-ink);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.crumb:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}
</style>
