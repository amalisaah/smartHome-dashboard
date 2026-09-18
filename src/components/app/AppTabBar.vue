<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SText } from '@/components/atoms'
import { APP_TABS, type AppTab } from '@/components/app/tabs'

const route = useRoute()
const router = useRouter()

/**
 * A tab owns its section and everything under it, so `/shipments/SH-015` still
 * lights Shipments. The catalogue sits at `/`, which prefixes every path, so it
 * is matched exactly.
 */
const isActive = (tab: AppTab) => {
  if (!tab.to) return false
  const path = router.resolve(tab.to).path
  return path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(`${path}/`)
}

const tabs = computed(() => APP_TABS.map((tab) => ({ ...tab, active: isActive(tab) })))
</script>

<template>
  <nav class="tab-bar" aria-label="Sections">
    <component
      :is="tab.to ? 'RouterLink' : 'span'"
      v-for="tab in tabs"
      :key="tab.label"
      :to="tab.to"
      class="tab"
      :class="{ 'tab--active': tab.active, 'tab--inert': !tab.to }"
      :aria-current="tab.active ? 'page' : undefined"
    >
      <SText type="tab" :color="tab.active ? 'fg' : 'fg-2-soft'">{{ tab.label }}</SText>
    </component>
  </nav>
</template>

<style scoped>
.tab-bar {
  display: flex;
  gap: 4px;
  padding: 8px 16px 0;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.tab {
  padding: 10px 14px;
  background: none;
  border: none;
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
  outline-offset: -1px;
}

/* A section with no screen yet: it reads the same, and it does not invite a click. */
.tab--inert {
  cursor: default;
}

.tab--inert:hover :deep(.s-text) {
  color: var(--color-fg-2-soft);
}

.tab--active {
  border-bottom-color: var(--color-action);
}

.tab--active :deep(.s-text) {
  font-weight: 600;
}
</style>
