<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * What opens each column. The label says which authority it answers to; the rule
 * carries it across so the two read as a pair.
 */
</script>

<template>
  <div class="rule">
    <SText type="micro" color="micro"><slot /></SText>
    <span class="line" aria-hidden="true" />
  </div>
</template>

<style scoped>
.rule {
  display: flex;
  align-items: center;
  gap: 10px;
}

.line {
  flex: 1;
  height: 1px;
  background: var(--color-line);
}
</style>
