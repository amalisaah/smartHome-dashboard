<script setup lang="ts">
import { SButton, SFilterChip, SInput } from '@/components/atoms'
import type { CustomerFilterDef, CustomerFilterKey } from '@/types/customers'

defineProps<{
  filters: CustomerFilterDef[]
  active: CustomerFilterKey
  /** Every chip renders inactive while a query is present. */
  searching: boolean
}>()

const query = defineModel<string>('query', { required: true })

defineEmits<{ select: [key: CustomerFilterKey]; newEnquiry: [] }>()

/** `to chase — quoted · 7`, or the label alone until the counts land. */
const chipLabel = (filter: CustomerFilterDef) =>
  filter.count === null ? filter.label : `${filter.label} · ${filter.count}`
</script>

<template>
  <div class="toolbar">
    <SInput
      v-model="query"
      class="search"
      aria-label="Search everyone — name or phone"
      placeholder="Search everyone — name or phone"
    />

    <span class="divider" aria-hidden="true" />

    <SFilterChip
      v-for="filter in filters"
      :key="filter.key"
      variant="choice"
      :selected="!searching && filter.key === active"
      @click="$emit('select', filter.key)"
    >
      {{ chipLabel(filter) }}
    </SFilterChip>

    <span class="spacer" aria-hidden="true" />

    <SButton variant="chrome" size="toolbar" @click="$emit('newEnquiry')">New enquiry</SButton>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-line);
}

/* Fixed at the drawn width: the chips beside it must not be squeezed. */
.search {
  width: 360px;
  flex: none;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--color-line);
  flex: none;
}

.spacer {
  flex: 1;
}
</style>
