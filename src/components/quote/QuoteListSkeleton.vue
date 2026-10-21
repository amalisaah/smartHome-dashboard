<script setup lang="ts">
/**
 * Rows at the height the real ones stand at, so the list does not jump when
 * they arrive — 64px on the phone, 80px cards on the laptop.
 *
 * **No full-page spinner.** The band, the header, the search and the tabs are
 * all on screen already; a spinner over them would hide controls that work.
 */
withDefaults(defineProps<{ device: 'phone' | 'desk'; rows?: number }>(), { rows: 5 })
</script>

<template>
  <div class="skeletons" :class="`skeletons--${device}`" aria-hidden="true">
    <div v-for="n in rows" :key="n" class="skeleton" />
  </div>
</template>

<style scoped>
.skeletons--desk {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton {
  background: var(--color-surface);
}

.skeletons--phone .skeleton {
  height: 64px;
  border-bottom: 1px solid var(--color-divider);
}

.skeletons--desk .skeleton {
  height: 80px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}
</style>
