<script setup lang="ts">
import { computed } from 'vue'
import AppBar from '@/components/app/AppBar.vue'
import AppTabBar from '@/components/app/AppTabBar.vue'
import { useOnline } from '@/composables/useOnline'
import { SAVE_STATUS_DATE } from '@/data/catalogueMock'

const props = withDefaults(
  defineProps<{
    /** The frame's width at the handoff that drew this screen. */
    maxWidth?: number
    /**
     * The app bar and the tab bar. Off for the phone frame, which carries its own
     * header and is the device rather than a frame inside one.
     */
    chrome?: boolean
  }>(),
  { maxWidth: 1440, chrome: true },
)

const online = useOnline()

const status = computed(() =>
  online.value
    ? `${SAVE_STATUS_DATE} · all changes saved`
    : 'No connection — showing last known counts',
)

const frameStyle = computed(() => ({ maxWidth: `${props.maxWidth}px` }))
</script>

<template>
  <main class="page">
    <div class="frame" :style="frameStyle">
      <template v-if="chrome">
        <AppBar :status="status" :offline="!online" />
        <AppTabBar />
      </template>
      <slot />
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 48px;
  background: var(--color-chrome);
}

.frame {
  width: 100%;
  margin: 0 auto;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-1);
  /* `clip` rather than `hidden`: it rounds the corners without becoming a
     scroll container, so the sticky table header still works. */
  overflow: clip;
  /* The reference sets no line-height, so rows sit at the fonts' own metrics. */
  line-height: normal;
}

@media (max-width: 1200px) {
  .page {
    padding: 24px;
  }
}

/* The phone frame is the device — no chrome around it. */
@media (max-width: 899px) {
  .page {
    padding: 0;
  }

  .frame {
    min-height: 100vh;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
}
</style>
