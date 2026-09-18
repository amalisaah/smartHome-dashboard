<script setup lang="ts">
import { SInput, SText } from '@/components/atoms'
import { OVERRIDE_NOTE } from '@/data/shipmentMock'
import type { OverrideRow } from '@/types/shipment'

defineProps<{
  overrides: OverrideRow[]
  /** What is left for everything else, once the named splits are taken out. */
  remainder: string
  readOnly?: boolean
}>()

const emit = defineEmits<{ 'update:percent': [index: number, percent: string] }>()

const onInput = (index: number, value: string) => emit('update:percent', index, value)
</script>

<template>
  <!-- Beside the default, visible, and still not the path. -->
  <div class="panel">
    <SText type="micro" color="micro">Override the split</SText>

    <div class="rows">
      <div v-for="(override, index) in overrides" :key="override.reason" class="row">
        <SText type="row-meta" color="fg" class="reason">{{ override.reason }}</SText>
        <SInput
          class="split"
          variant="accent"
          size="split"
          mono
          align="right"
          suffix="%"
          :disabled="readOnly"
          :aria-label="`Share carried by ${override.reason}`"
          :model-value="override.percent"
          @update:model-value="onInput(index, $event)"
        />
      </div>

      <div class="row">
        <SText type="row-meta" color="fg-2-soft" class="reason">Everything else — by value</SText>
        <SText type="money" color="fg-2-soft" class="remainder">{{ remainder }}</SText>
      </div>
    </div>

    <SText type="caption" class="note">{{ OVERRIDE_NOTE }}</SText>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
  background: var(--color-surface);
  min-width: 0;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reason {
  flex: 1;
  min-width: 0;
}

.split {
  width: 92px;
  flex: none;
}

.remainder {
  width: 92px;
  text-align: right;
  flex: none;
}

.note {
  line-height: 1.6;
}
</style>
