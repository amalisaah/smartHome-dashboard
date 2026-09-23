<script setup lang="ts">
import { SButton } from '@/components/atoms'

/**
 * Figures, then words, then one primary action. Adjusting the count is the thing
 * he actually does on site; editing the record is the thing he does afterwards,
 * so it is beside it and not the same size.
 */
defineEmits<{ adjust: []; edit: [] }>()
</script>

<template>
  <div class="bar">
    <SButton size="lg" class="primary" @click="$emit('adjust')">Adjust count</SButton>
    <SButton variant="secondary" size="lg" @click="$emit('edit')">Edit</SButton>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  /* Holds the action he came here to take, so it stays reachable as the
     movements scroll — the same posture as the catalogue's phone bar. */
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.primary {
  flex: 1;
}
</style>
