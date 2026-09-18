<script setup lang="ts">
import { SBadge, SButton, SText } from '@/components/atoms'
import { formatCount, formatShortDate } from '@/utils/format'

const props = defineProps<{
  unitCount: number
  /** A received shipment has no exits to offer but the way out. */
  readOnly?: boolean
  receivedAt?: string | null
}>()

defineEmits<{ back: []; draft: []; receive: []; close: [] }>()
</script>

<template>
  <div class="bar">
    <span class="state">
      <SBadge v-if="readOnly" variant="received" size="state">
        received {{ props.receivedAt ? formatShortDate(props.receivedAt) : '' }}
      </SBadge>
      <SBadge v-else variant="draft" size="state">still a draft</SBadge>
      <SText type="row-meta" color="fg-2-soft">
        {{ readOnly
          ? 'Stock and costs moved when you received it.'
          : 'Stock and costs change only when you receive it.' }}
      </SText>
    </span>

    <div class="exits">
      <template v-if="readOnly">
        <SButton variant="secondary" size="md" @click="$emit('close')">Close</SButton>
      </template>

      <!-- Two exits, deliberately unequal: quiet-and-safe, then a primary whose
           label states its consequence. -->
      <template v-else>
        <SButton variant="ghost" size="md" @click="$emit('back')">Back to lines</SButton>
        <SButton variant="secondary" size="md" @click="$emit('draft')">Keep as draft</SButton>
        <SButton size="md" @click="$emit('receive')">
          Receive shipment — {{ formatCount(unitCount) }} units in
        </SButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  background: var(--color-bg);
}

.state {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.exits {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
</style>
