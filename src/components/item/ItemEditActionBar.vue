<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import type { SaveStatus } from '@/composables/useItemDetail'

/**
 * The phone Edit form's way out. The laptop puts Save and Discard in the header
 * beside the status line; at 390px the header is the item's name and the action
 * bar is where a press belongs, so they go to the bottom edge — the same place
 * `Adjust count` sits on the screen this form opened from.
 */
defineProps<{
  status: SaveStatus
  dirty?: boolean
  saving?: boolean
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
        Save
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
  /* The one press this screen exists for, kept against the thumb as the form
     scrolls under it. */
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.says {
  /* Above the buttons rather than beside them: at 390px it is a sentence, and a
     sentence and two 48px doors do not share a line. */
  min-width: 0;
}

.exits {
  display: flex;
  gap: 10px;
}

/* Save is the reason he is here, so it takes the room. */
.save {
  flex: 1;
}
</style>
