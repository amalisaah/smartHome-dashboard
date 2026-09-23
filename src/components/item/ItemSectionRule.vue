<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * What opens each of the two columns. The label says which authority the column
 * answers to; the rule carries it across so the two columns read as a pair
 * rather than as two unrelated stacks.
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
