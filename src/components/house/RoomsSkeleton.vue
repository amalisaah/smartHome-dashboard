<script setup lang="ts">
/**
 * The list while the rooms are still being read.
 *
 * Rows at the height they will be, not a spinner: the header, the tabs and the
 * field are already on screen and already live, so what is missing is a list of
 * names and the shape of one is a truer thing to show than a wheel. He can
 * start typing the next room before the read lands.
 */
withDefaults(defineProps<{ size?: 'phone' | 'desk'; rows?: number }>(), {
  size: 'phone',
  rows: 4,
})
</script>

<template>
  <div class="skeleton" :class="`skeleton--${size}`" aria-hidden="true">
    <div v-for="row in rows" :key="row" class="row" />
  </div>
</template>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
}

/* The heights the real rows stand at, so nothing moves when they arrive. */
.skeleton--phone .row {
  min-height: 55px;
  border-bottom: 1px solid var(--color-divider);
}

.skeleton--desk .row {
  min-height: 49px;
  border-bottom: 1px solid var(--color-divider);
}

.row {
  background: var(--color-surface);
}
</style>
