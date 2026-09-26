<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import type { SaveStatus } from '@/composables/useItemDetail'

/**
 * The laptop puts Save and Discard in the header; at 390px a press belongs at the
 * bottom edge, where `Adjust count` sits on the screen this form opened from.
 */
defineProps<{
  status: SaveStatus
  dirty?: boolean
  saving?: boolean
  /** The record does not exist yet, so the press creates rather than saves. */
  creating?: boolean
}>()

defineEmits<{ save: []; discard: [] }>()
</script>

<template>
  <div class="bar">
    <SText
      type="list-meta"
      :color="status.tone === 'risk' ? 'risk' : undefined"
      role="status"
      aria-live="polite"
      class="says"
    >
      {{ status.label }}
    </SText>

    <div class="exits">
      <SButton
        variant="secondary"
        size="lg"
        :disabled="!dirty || saving"
        @click="$emit('discard')"
      >
        Discard
      </SButton>
      <SButton size="lg" class="save" :disabled="!dirty" :loading="saving" @click="$emit('save')">
        {{ creating ? 'Create item' : 'Save' }}
      </SButton>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  /* Kept against the thumb as the form scrolls under it. */
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.says {
  /* Above the buttons: a sentence and two 48px doors do not share a line. */
  min-width: 0;
}

.exits {
  display: flex;
  gap: 10px;
}

.save {
  flex: 1;
}
</style>
