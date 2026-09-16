<script setup lang="ts">
import { SInput, SText } from '@/components/atoms'
import { formatCount } from '@/utils/format'

defineProps<{
  totalCount: number
  offline?: boolean
}>()

const query = defineModel<string>('query', { required: true })
</script>

<template>
  <div class="phone-header">
    <div class="title-row">
      <SText type="screen-title" as="h1" color="inverse">Catalogue</SText>
      <SText
        type="cell-meta"
        :color="offline ? 'risk' : 'muted-dark'"
        role="status"
        aria-live="polite"
      >
        {{ offline ? 'No connection — showing last known counts' : `${formatCount(totalCount)} items` }}
      </SText>
    </div>
    <SInput
      v-model="query"
      variant="on-dark"
      size="lg"
      aria-label="Search the catalogue"
      placeholder="Search name, keyword, supplier"
    />
  </div>
</template>

<style scoped>
.phone-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: var(--color-fg);
  position: sticky;
  top: 0;
  z-index: 2;
}

.title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  /* The offline string is longer than the item count and wraps beneath. */
  flex-wrap: wrap;
}
</style>
