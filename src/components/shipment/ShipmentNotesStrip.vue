<script setup lang="ts">
import { SText, STextarea } from '@/components/atoms'
import { NOTES_COPY } from '@/data/shipmentCopy'

defineProps<{ notes: string }>()

const emit = defineEmits<{ 'update:notes': [notes: string] }>()
</script>

<template>
  <div class="strip">
    <div class="strip-header">
      <SText type="pane-title">Notes</SText>
      <SText type="hint">{{ NOTES_COPY.hint }}</SText>
    </div>

    <STextarea
      :model-value="notes"
      :rows="3"
      :placeholder="NOTES_COPY.placeholder"
      ariaLabel="Notes on this shipment"
      @update:model-value="emit('update:notes', $event)"
    />
  </div>
</template>

<style scoped>
.strip {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 20px 20px;
  border-top: 1px solid var(--color-line);
  /* On `--bg`, like every other element that reaches a corner of the frame:
     it is what lets the card radius read at the two bottom corners. */
  background: var(--color-bg);
  border-bottom-left-radius: var(--radius-card);
  border-bottom-right-radius: var(--radius-card);
}

.strip-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
</style>
