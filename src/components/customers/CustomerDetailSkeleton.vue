<script setup lang="ts">
/**
 * Surface blocks at the heights the real thing stands at. The frame, the app bar
 * and the removal band are already up around this — the handoff is explicit that
 * nothing waits behind a full-page spinner, because the two exits are the part
 * of this screen that must never appear late.
 */
const HISTORY_ROWS = 6
</script>

<template>
  <div class="skeleton" aria-hidden="true">
    <div class="identity">
      <span class="bar bar--crumb" />
      <span class="bar bar--name" />
      <span class="bar bar--contact" />
      <div class="actions">
        <span class="bar bar--button" />
        <span class="bar bar--button bar--button-wide" />
      </div>
    </div>

    <div class="history">
      <span class="bar bar--head" />
      <div v-for="index in HISTORY_ROWS" :key="index" class="entry">
        <span class="bar bar--date" />
        <span class="bar bar--line" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.identity {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.actions {
  display: flex;
  gap: 10px;
  padding-top: 6px;
}

.history {
  display: flex;
  flex-direction: column;
}

.entry {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-divider);
}

.bar {
  display: block;
  height: 14px;
  background: var(--color-surface);
  border-radius: var(--radius-flag);
}

.bar--crumb {
  width: 76px;
  height: 11px;
}

/* The 32px name, at the height it will stand at. */
.bar--name {
  width: 280px;
  height: 38px;
  border-radius: var(--radius-chip);
}

.bar--contact {
  width: 340px;
  height: 18px;
}

.bar--button {
  width: 126px;
  height: 40px;
  border-radius: var(--radius-md);
}

.bar--button-wide {
  width: 168px;
}

.bar--head {
  width: 100%;
  height: 12px;
  margin-bottom: 8px;
}

.bar--date {
  width: 48px;
  height: 12px;
}

.bar--line {
  width: 72%;
}
</style>
