<script setup lang="ts">
import { SText } from '@/components/atoms'
import type { DuplicateMatch } from '@/types/customers'

defineProps<{ duplicate: DuplicateMatch }>()

defineEmits<{ open: [id: number] }>()
</script>

<template>
  <!-- A notice, never a block: he is standing in front of her. -->
  <div class="duplicate" role="status">
    <span class="dot" aria-hidden="true" />
    <SText type="meta" color="fg" class="copy">
      <strong>{{ duplicate.name }}</strong> is already here, {{ duplicate.phone }}.
      <button type="button" class="open-hers" @click="$emit('open', duplicate.id)">
        <strong>Open hers</strong>
      </button>
      instead?
    </SText>
  </div>
</template>

<style scoped>
.duplicate {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--color-row-risk-tint);
  border: 1px solid var(--color-risk);
  border-radius: var(--radius-card);
}

.dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: var(--radius-pill);
  background: var(--color-risk);
}

.copy {
  flex: 1;
}

/* A link inside a sentence, so it keeps the sentence's metrics. */
.open-hers {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--color-action-ink);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.open-hers:hover {
  color: var(--color-action-hover);
}

.open-hers:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}
</style>
