<script setup lang="ts">
import { computed } from 'vue'
import { SFilterChip, SSelect } from '@/components/atoms'
import { CATALOGUE_GROUPS, type GroupFilter } from '@/types/catalogue'

defineProps<{
  lowStockCount: number
  attentionCount: number
  lowStockOnly: boolean
  attentionOnly: boolean
}>()

const groupFilter = defineModel<GroupFilter>('groupFilter', { required: true })

defineEmits<{ toggleLowStock: []; toggleAttention: [] }>()

const groupOptions = computed(() => [
  { label: 'All groups', value: 'all' as GroupFilter },
  ...CATALOGUE_GROUPS.map((group) => ({ label: group, value: group as GroupFilter })),
])
</script>

<template>
  <div class="filters">
    <SFilterChip
      v-if="lowStockCount > 0"
      variant="risk-filled"
      size="phone"
      :selected="lowStockOnly"
      @click="$emit('toggleLowStock')"
    >
      low · {{ lowStockCount }}
    </SFilterChip>

    <SFilterChip
      v-if="attentionCount > 0"
      variant="risk-outlined"
      size="phone"
      :selected="attentionOnly"
      @click="$emit('toggleAttention')"
    >
      attention · {{ attentionCount }}
    </SFilterChip>

    <SSelect
      v-model="groupFilter"
      variant="chip"
      :options="groupOptions"
      aria-label="Filter by group"
      class="group-chip"
    />
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-line);
  /* No horizontal scroll on the page — the chip row scrolls on its own. */
  overflow-x: auto;
  scrollbar-width: none;
}

.filters::-webkit-scrollbar {
  display: none;
}

.group-chip {
  flex: none;
}

/* Phone door: the chip keeps its drawn box, while the select's own box grows
   to 48px and overhangs it symmetrically, so the tap target is 48px tall. */
.group-chip :deep(.s-select) {
  min-height: var(--hit-min);
  margin-block: calc((var(--hit-min) - 33px) / -2);
}
</style>
