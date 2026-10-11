<script setup lang="ts">
import { computed } from 'vue'
import AppBar from '@/components/app/AppBar.vue'
import AppTabBar from '@/components/app/AppTabBar.vue'
import { useOnline } from '@/composables/useOnline'
import { saveState } from '@/composables/useSaveState'
import { formatWeekdayDate } from '@/utils/format'

withDefaults(
  defineProps<{
    /**
     * The app bar and the tab bar. Off for the phone frame, which carries its own
     * header and is the device rather than a frame inside one.
     */
    chrome?: boolean
  }>(),
  { chrome: true },
)

const online = useOnline()

/** Today's, read once on mount: the bar dates the session, not the minute. */
const today = formatWeekdayDate()

/**
 * What the bar says about the session. Losing the connection outranks a save
 * state, because it explains it — and a write that failed says so rather than
 * letting "all changes saved" stand over an unsaved change.
 */
const status = computed(() => {
  if (!online.value) return 'No connection — showing last known counts'
  if (saveState.value === 'saving') return `${today} · saving`
  if (saveState.value === 'failed') return `${today} · not saved`
  // `idle` and `saved` read the same: nothing is outstanding either way.
  return `${today} · all changes saved`
})

const alarmed = computed(() => !online.value || saveState.value === 'failed')
</script>

<template>
  <main class="page">
    <div class="frame">
      <template v-if="chrome">
        <AppBar :status="status" :alarmed="alarmed" />
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

/* One frame width for the whole app: every section sits under the same app bar,
   so they may not sit on differently sized sheets. */
.frame {
  width: 100%;
  max-width: 1440px;
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
