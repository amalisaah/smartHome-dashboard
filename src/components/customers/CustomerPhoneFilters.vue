<script setup lang="ts">
import { computed } from 'vue'
import { SFilterChip } from '@/components/atoms'
import { PHONE_FILTERS, type CustomerFilterDef, type CustomerFilterKey } from '@/types/customers'

const props = defineProps<{
  filters: CustomerFilterDef[]
  active: CustomerFilterKey
  searching: boolean
}>()

defineEmits<{ select: [key: CustomerFilterKey] }>()

/**
 * Four of the six, `everyone` first: the phone finds a person rather than works
 * a queue. No counts — a count is for choosing which list to work, and that was
 * decided at a desk.
 */
const chips = computed(() =>
  PHONE_FILTERS.map((key) => props.filters.find((def) => def.key === key)).filter(
    (def): def is CustomerFilterDef => def !== undefined,
  ),
)
</script>

<template>
  <div class="filter-row">
    <SFilterChip
      v-for="filter in chips"
      :key="filter.key"
      variant="choice"
      size="phone"
      :selected="!searching && filter.key === active"
      @click="$emit('select', filter.key)"
    >
      {{ filter.phoneLabel }}
    </SFilterChip>
  </div>
</template>

<style scoped>
/* The one row that scrolls sideways; it scrolls rather than wraps so the list
   below never starts at a different height. */
.filter-row {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-line);
  overflow-x: auto;
}

.filter-row > * {
  flex: none;
}
</style>
