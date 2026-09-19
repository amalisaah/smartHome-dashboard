<script setup lang="ts">
import { computed } from 'vue'
import { SBadge, SButton, SText } from '@/components/atoms'

const props = defineProps<{
  /** Empty until it is saved — a shipment he has just started has no number. */
  shipmentRef: string
  /** `saved on this device · 4 lines`, or what the offline state says instead. */
  status: string
  offline: boolean
  /** Nothing entered yet: there is no shipment to put on the list. */
  empty: boolean
  /** A write is in flight. It changes the dot, and nothing else: no control on
      this screen may go dead while he is still typing in it. */
  saving?: boolean
}>()

defineEmits<{ close: []; save: [] }>()

/** It is called by its ref once it has one, and `New shipment` until then. */
const title = computed(() =>
  props.shipmentRef ? `Shipment ${props.shipmentRef}` : 'New shipment',
)
</script>

<template>
  <div class="header">
    <div class="identity">
      <SText type="frame-title" as="h1">{{ title }}</SText>
      <SBadge variant="draft" size="state">draft · affects nothing yet</SBadge>
    </div>

    <div class="actions">
      <!-- A dot, never a spinner: saving is a state, not progress. -->
      <span class="save">
        <span
          class="dot"
          :class="{ 'dot--offline': offline, 'dot--saving': saving && !offline }"
          aria-hidden="true"
        />
        <SText type="cell-meta" :color="offline ? 'risk' : undefined">{{ status }}</SText>
      </span>
      <SButton variant="ghost" size="md" @click="$emit('close')">Close</SButton>
      <!-- Typing is already saved on this device; this is what files the
           shipment on the list, where he can find it by ref. -->
      <SButton size="md" :disabled="empty" @click="$emit('save')">Save draft</SButton>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-line);
}

.identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.save {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: var(--color-action);
  flex: none;
}

.dot--offline {
  background: var(--color-risk);
}

/* In flight. A quieter dot, not a spinner: it is a state, not progress. */
.dot--saving {
  background: var(--color-fg-3);
}
</style>
