<script setup lang="ts">
import { SButton } from '@/components/atoms'
import type { PhraseChip } from '@/data/houseVisitCopy'

/**
 * The words he writes every visit, as buttons.
 *
 * **A chip only types its words into the textarea above it.** It sets no flag,
 * fills no structured field and means nothing on its own — what it inserts is
 * prose he can then edit or delete like anything else he typed. That is the
 * whole of it, and it is why they are quiet mono chips rather than toggles: a
 * chip that looked selectable would promise a record that does not exist.
 *
 * They stay visible after use, because a phrase can be wanted twice, and the
 * `+` stays on the label because it is the chip saying what it does.
 */
defineProps<{
  phrases: PhraseChip[]
  /** `phone` is the 44px thumb; `desk` the inline chip beside a mouse. */
  size?: 'phone' | 'desk'
}>()

defineEmits<{ insert: [text: string] }>()
</script>

<template>
  <div class="chips" :class="`chips--${size ?? 'phone'}`">
    <SButton
      v-for="phrase in phrases"
      :key="phrase.text"
      variant="phrase"
      :size="size === 'desk' ? 'sm' : 'md'"
      @click="$emit('insert', phrase.text)"
    >
      + {{ phrase.text }}
    </SButton>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
}

.chips--phone {
  gap: 8px;
}

.chips--desk {
  gap: 6px;
}
</style>
