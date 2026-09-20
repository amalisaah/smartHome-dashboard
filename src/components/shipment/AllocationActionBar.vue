<script setup lang="ts">
import { SBadge, SButton, SText } from '@/components/atoms'
import { formatCount, formatShortDate } from '@/utils/format'

const props = defineProps<{
  unitCount: number
  /** A received shipment has no exits to offer but the way out. */
  readOnly?: boolean
  receivedAt?: string | null
  /** There is something unsaved to save. With nothing changed there is no offer. */
  dirty?: boolean
  /** The split does not yet add up, so there is nothing worth sending. */
  saveBlocked?: boolean
  saving?: boolean
}>()

defineEmits<{ back: []; draft: []; discard: []; receive: []; close: [] }>()
</script>

<template>
  <div class="bar">
    <span class="state">
      <SBadge v-if="readOnly" variant="received" size="state">
        received {{ props.receivedAt ? formatShortDate(props.receivedAt) : '' }}
      </SBadge>
      <SBadge v-else variant="draft" size="state">still a draft</SBadge>
      <!-- While there is something unsaved, this says why there is nothing to
           receive with — the reason sits next to the action that is missing. -->
      <SText type="row-meta" color="fg-2-soft">
        {{ readOnly
          ? 'Stock and costs moved when you received it.'
          : dirty
            ? 'Save or discard your changes before receiving.'
            : 'Stock and costs change only when you receive it.' }}
      </SText>
    </span>

    <div class="exits">
      <template v-if="readOnly">
        <SButton variant="secondary" size="md" @click="$emit('close')">Close</SButton>
      </template>

      <!-- Two exits, deliberately unequal: quiet-and-safe, then a primary whose
           label states its consequence.

           With something unsaved there is no receiving: the primary is the save,
           and beside it the way out of the changes. Receiving cannot commit
           figures the server has not been given, because it is not there to press. -->
      <template v-else>
        <SButton variant="ghost" size="md" @click="$emit('back')">Back to lines</SButton>

        <template v-if="dirty">
          <SButton variant="ghost" size="md" :disabled="saving" @click="$emit('discard')">
            Discard changes
          </SButton>
          <SButton size="md" :disabled="saveBlocked" :loading="saving" @click="$emit('draft')">
            Save as draft
          </SButton>
        </template>

        <SButton v-else size="md" @click="$emit('receive')">
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
