<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { SText } from '@/components/atoms'
import { NOTHING_INSTALLED, OPEN_INSTALLED } from '@/data/houseVisitCopy'

/**
 * What is in the house already, as a count and a door.
 *
 * The empty state is the designed one, and it is the one a house being visited
 * for the first time is in. A populated card is not drawn in this handoff and
 * is not invented here: the count is shown and block C is where it is read.
 */
defineProps<{
  customerId: number
  houseId: number
  count: number
}>()
</script>

<template>
  <section class="card">
    <SText type="micro" color="micro" as="h2">Installed · {{ count }}</SText>
    <SText v-if="count === 0" type="cell" color="fg-2">{{ NOTHING_INSTALLED }}</SText>
    <RouterLink
      :to="{ name: 'house-installed', params: { id: customerId, houseId } }"
      class="link"
    >
      <SText type="tab" color="action-ink">{{ OPEN_INSTALLED }}</SText>
    </RouterLink>
  </section>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 20px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  border-radius: var(--radius-flag);
}

.link:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
</style>
