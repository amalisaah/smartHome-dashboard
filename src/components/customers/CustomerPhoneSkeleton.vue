<script setup lang="ts">
/** Surface blocks at the real row height. No shimmer, no page spinner. */
const ROWS = 7
</script>

<template>
  <div aria-hidden="true">
    <div v-for="index in ROWS" :key="index" class="skeleton-row">
      <span class="left">
        <span class="bar bar--name" />
        <span class="bar bar--meta" />
      </span>
      <span class="bar bar--chip" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  min-height: 66px;
  border-bottom: 1px solid var(--color-divider);
}

.left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.bar {
  height: 14px;
  background: var(--color-surface);
  border-radius: var(--radius-flag);
}

.bar--name {
  width: 52%;
}

.bar--meta {
  width: 74%;
}

.bar--chip {
  width: 62px;
  height: 22px;
  flex: none;
  border-radius: var(--radius-chip);
}
</style>
