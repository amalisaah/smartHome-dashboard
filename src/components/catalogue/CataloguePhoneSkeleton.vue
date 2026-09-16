<script setup lang="ts">
/** Surface blocks at the real 72px row height. No shimmer, never a spinner. */
const ROWS = 6
</script>

<template>
  <div aria-hidden="true">
    <div v-for="index in ROWS" :key="index" class="row">
      <span class="left">
        <span class="bar bar--name" />
        <span class="bar bar--meta" />
      </span>
      <span class="right">
        <span class="bar bar--figure" />
        <span class="bar bar--cost" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-divider);
  min-height: 72px;
}

.left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex: none;
}

.bar {
  display: block;
  background: var(--color-surface);
  border-radius: var(--radius-flag);
}

.bar--name {
  height: 15px;
  width: 70%;
}

.bar--meta {
  height: 12px;
  width: 50%;
}

.bar--figure {
  height: 16px;
  width: 64px;
}

.bar--cost {
  height: 11px;
  width: 78px;
}
</style>
