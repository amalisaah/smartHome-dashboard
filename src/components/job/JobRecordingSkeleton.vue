<script setup lang="ts">
/**
 * The screen's shape while the one read is in flight.
 *
 * It draws the frame and not the figures: a skeleton with number-shaped blocks
 * in the profit card would be a guess at money, and this is the screen where a
 * guess at money is the one thing that must never appear.
 */
</script>

<template>
  <div class="grid" aria-hidden="true">
    <div class="col">
      <div class="bar bar--title" />
      <div class="block block--type" />
      <div class="block block--lines" />
      <div class="block block--complete" />
    </div>
    <div class="col">
      <div class="block block--profit" />
      <div class="block block--money" />
      <div class="block block--costs" />
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 32px;
  padding: 24px 32px 32px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.col + .col {
  gap: 16px;
}

.bar,
.block {
  background: var(--color-surface);
  border-radius: var(--radius-card);
}

.bar--title {
  height: 56px;
  width: 420px;
  max-width: 100%;
  border-radius: var(--radius-md);
}

.block--type {
  height: 180px;
}

.block--lines {
  height: 320px;
}

.block--complete {
  height: 96px;
}

.block--profit {
  height: 150px;
  background: var(--color-line);
}

.block--money {
  height: 260px;
}

.block--costs {
  height: 220px;
}
</style>
