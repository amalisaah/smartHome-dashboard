<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import { SHARED_COST_NOTE } from '@/data/shipmentCopy'
import { formatCedi, formatMargin } from '@/utils/format'

defineProps<{
  totalPesewas: number
  /** Shared cost as a share of product value — the figure the note bolds. */
  sharedPercent: number
  /** No costs and no lines: nothing to spread, and nothing to spread it over. */
  empty: boolean
}>()

defineEmits<{ preview: [] }>()
</script>

<template>
  <div class="block">
    <div class="line">
      <SText type="ui">Shipment total</SText>
      <SText type="total">{{ formatCedi(totalPesewas) }}</SText>
    </div>

    <SText type="caption" class="note">
      {{ SHARED_COST_NOTE.lead
      }}<b>{{ formatMargin(sharedPercent) }}</b>{{ SHARED_COST_NOTE.tail }}
    </SText>

    <!-- A question, not a verb: the preview is what he came here for. It is not
         offered before there is anything for it to answer about. -->
    <SButton v-if="!empty" size="md" @click="$emit('preview')">
      See what this does to my costs
    </SButton>
  </div>
</template>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-line);
}

.line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.note {
  line-height: 1.6;
}

.note b {
  font-weight: 700;
  color: var(--color-fg);
}
</style>
