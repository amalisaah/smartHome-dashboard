<script setup lang="ts">
import { computed } from 'vue'
import { SFilterChip, SInput, SSelect } from '@/components/atoms'
import { CATALOGUE_GROUPS, type GroupFilter } from '@/types/catalogue'
import { formatCount } from '@/utils/format'

defineProps<{
  totalCount: number
  lowStockCount: number
  attentionCount: number
  lowStockOnly: boolean
  attentionOnly: boolean
}>()

const query = defineModel<string>('query', { required: true })
const groupFilter = defineModel<GroupFilter>('groupFilter', { required: true })

defineEmits<{ toggleLowStock: []; toggleAttention: [] }>()

const groupOptions = computed(() => [
  { label: 'All groups', value: 'all' as GroupFilter },
  ...CATALOGUE_GROUPS.map((group) => ({ label: group, value: group as GroupFilter })),
])
</script>

<template>
  <div class="toolbar">
    <SInput
      v-model="query"
      class="search"
      :aria-label="`Search ${formatCount(totalCount)} items`"
      :placeholder="`Search ${formatCount(totalCount)} items — name, keyword, supplier`"
    />

    <SFilterChip
      v-if="lowStockCount > 0"
      variant="risk-filled"
      :selected="lowStockOnly"
      @click="$emit('toggleLowStock')"
    >
      low stock · {{ lowStockCount }}
    </SFilterChip>

    <SFilterChip
      v-if="attentionCount > 0"
      variant="risk-outlined"
      :selected="attentionOnly"
      @click="$emit('toggleAttention')"
    >
      needs attention · {{ attentionCount }}
    </SFilterChip>

    <span class="divider" aria-hidden="true" />

    <SSelect v-model="groupFilter" :options="groupOptions" aria-label="Filter by group" />
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

.search {
  flex: 1;
  min-width: 0;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--color-line);
  flex: none;
}
</style>
