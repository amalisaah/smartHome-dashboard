<script setup lang="ts">
import { SBadge, SText } from '@/components/atoms'
import type { ChipTone, ReadoutChip, ReadoutSentence } from '@/types/shipment'

defineProps<{
  sentence: ReadoutSentence
  chips: ReadoutChip[]
}>()

/** One action colour, one risk colour: a chip's tone is which of them it is. */
const CHIP_VARIANT: Record<ChipTone, 'neutral' | 'incomplete' | 'overridden'> = {
  neutral: 'neutral',
  warn: 'incomplete',
  action: 'overridden',
}
</script>

<template>
  <div class="readout">
    <SText type="micro" color="micro">Read it in one line</SText>

    <!-- The item that actually got hurt, named, with its per-unit figure. -->
    <SText type="body">
      {{ sentence.lead }}<b>{{ sentence.emphasis }}</b>{{ sentence.tail }}
    </SText>

    <div class="chips">
      <SBadge
        v-for="chip in chips"
        :key="chip.text"
        :variant="CHIP_VARIANT[chip.tone]"
        size="state"
      >
        {{ chip.text }}
      </SBadge>
    </div>
  </div>
</template>

<style scoped>
.readout {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 24px;
  border-right: 1px solid var(--color-line);
  min-width: 0;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
