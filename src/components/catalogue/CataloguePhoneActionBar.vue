<script setup lang="ts">
import { computed } from 'vue'
import { SButton, SText } from '@/components/atoms'
import { formatCount } from '@/utils/format'

const props = defineProps<{
  matchCount: number
  totalCount: number
  query: string
  filtered: boolean
}>()

defineEmits<{ logShipment: [] }>()

const countLine = computed(() => {
  if (!props.filtered) return `${formatCount(props.totalCount)} items`
  const scope = `${formatCount(props.matchCount)} of ${formatCount(props.totalCount)}`
  return props.query.trim() ? `${scope} match "${props.query.trim()}"` : `${scope} items`
})
</script>

<template>
  <div class="action-bar">
    <SText type="cell-meta" class="count" role="status" aria-live="polite">{{ countLine }}</SText>
    <SButton size="lg" @click="$emit('logShipment')">Log a shipment</SButton>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  /* Holds the live match count and the primary action, so it stays reachable. */
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.count {
  flex: 1;
  min-width: 0;
}
</style>
