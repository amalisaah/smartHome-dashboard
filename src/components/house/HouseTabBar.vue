<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { SText } from '@/components/atoms'

/**
 * The house's three tabs, on both devices. Same three words, same order, same
 * counts; what changes is the box around them — a phone divides the width into
 * three equal thumbs, a laptop lets them sit at their own widths under the
 * title.
 *
 * The counts are **supplied**. `Installed · 0` goes quiet rather than hiding:
 * the tab is the answer to "what has been put in", and nothing is an answer.
 */
const props = defineProps<{
  customerId: number
  houseId: number
  roomCount: number
  installedCount: number
  /** `phone` is the three-up band under the dark header; `desk` the row under the title. */
  size?: 'phone' | 'desk'
}>()

const tabs = computed(() => [
  { label: 'Visit notes', to: { name: 'house-detail' }, quiet: false },
  { label: `Rooms · ${props.roomCount}`, to: { name: 'house-rooms' }, quiet: false },
  {
    label: `Installed · ${props.installedCount}`,
    to: { name: 'house-installed' },
    // Nothing to open yet, said in the ink rather than by taking the tab away.
    quiet: props.installedCount === 0,
  },
])

const params = computed(() => ({ id: props.customerId, houseId: props.houseId }))
</script>

<template>
  <nav class="tabs" :class="`tabs--${size ?? 'phone'}`" aria-label="This house">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.label"
      :to="{ ...tab.to, params }"
      class="tab"
      active-class="tab--active"
      :aria-current="undefined"
    >
      <SText type="ui" :color="tab.quiet ? 'fg-3' : 'fg-2-soft'">{{ tab.label }}</SText>
    </RouterLink>
  </nav>
</template>

<style scoped>
/* === phone: three equal thumbs across the frame === */
.tabs--phone {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.tabs--phone .tab {
  position: relative;
  padding: 13px 0;
  text-align: center;
}

/* The drawn band is 44px and the thumb needs 48. The box keeps its height and
   the target is hung off it, rather than the band growing to hold it. */
.tabs--phone .tab::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}

/* === desk: a row under the title === */
.tabs--desk {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--color-line);
}

.tabs--desk .tab {
  padding: 10px 14px;
}

/* === both === */
.tab {
  border-bottom: 2px solid transparent;
  text-decoration: none;
  cursor: pointer;
  transition: color 120ms ease-out, border-color 120ms ease-out;
}

.tab:hover :deep(.s-text) {
  color: var(--color-fg);
}

.tab:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.tab--active {
  border-bottom-color: var(--color-action);
}

.tab--active :deep(.s-text) {
  font-weight: 600;
  color: var(--color-fg);
}
</style>
