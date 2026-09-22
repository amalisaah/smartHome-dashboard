<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import type { CommitSummary } from '@/types/groups'

defineProps<{
  summary: CommitSummary
  /** The one thing the network changes here. Typing is never blocked. */
  offline?: boolean
  /** A row holds a name it cannot be saved under. That row says which. */
  blocked?: boolean
}>()

defineEmits<{ discard: []; apply: [] }>()
</script>

<template>
  <div class="bar">
    <div class="says">
      <!-- The consequence, in numbers, before the press. The count is mono so
           it reads as a figure inside the sentence rather than as more words. -->
      <SText type="ui">
        {{ summary.sentence.lead
        }}<b class="font-mono tabular-nums">{{ summary.sentence.count }}</b
        >{{ summary.sentence.tail }}
      </SText>
      <SText type="caption">{{ summary.detail }}</SText>
    </div>

    <div class="exits">
      <!-- No confirm on either: the bar is the confirmation, and re-typing the
           number is the undo. -->
      <SButton variant="ghost" size="md" @click="$emit('discard')">Discard</SButton>
      <!-- Blocked says only that it is waiting on a row; the row it is waiting
           on carries the reason, so the bar does not repeat it here. -->
      <SButton size="md" :disabled="offline || blocked" @click="$emit('apply')">
        {{
          blocked
            ? 'Apply — a name needs fixing'
            : offline
            ? 'Apply — waiting for connection'
            : summary.applyLabel
        }}
      </SButton>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: var(--color-row-action-tint);
  border-top: 1px solid var(--color-line);
}

.says {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.exits {
  display: flex;
  gap: 8px;
  flex: none;
}
</style>
