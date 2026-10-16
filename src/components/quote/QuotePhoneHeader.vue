<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { SText } from '@/components/atoms'
import { saveState } from '@/composables/useSaveState'
import type { QuoteHeader } from '@/types/quote'

/**
 * The phone's header: where he came from, whether the work is safe, and which
 * quote this is.
 *
 * The save state is **a dot, never a spinner**. Local-first saving is a state,
 * not progress — nothing here is being waited for, so nothing may spin. Offline
 * says where the work is being held rather than that something has gone wrong,
 * because nothing has.
 */
const props = defineProps<{
  header: QuoteHeader
  surname: string
  area: string | null
  online: boolean
  /** `14:02`, or null before anything has been written this session. */
  savedAt: string | null
  /** Whether unsubmitted work is sitting on this device. */
  dirty?: boolean
}>()

/**
 * Offline outranks everything; after that it reports what actually happened.
 *
 * It must never read "saved" while a submit has failed or while changes are
 * still only on the phone — this one line is how he knows the quote is safe,
 * and saying so when it is not is the worst thing this header can do.
 */
const status = computed(() => {
  if (!props.online) return 'no signal · held on phone'
  if (saveState.value === 'saving') return 'submitting…'
  if (saveState.value === 'failed') return 'not submitted'
  if (props.dirty) return 'held on phone · not submitted'
  return `saved${props.savedAt ? ` · ${props.savedAt}` : ''}`
})

const alarmed = computed(
  () => !props.online || saveState.value === 'failed' || props.dirty === true,
)
</script>

<template>
  <header class="head">
    <div class="top">
      <RouterLink :to="{ name: 'quotes' }" class="back">
        <SText type="cell" color="fg-2">‹ Quotes</SText>
      </RouterLink>

      <span class="state">
        <span class="dot" :class="alarmed ? 'dot--off' : 'dot--saved'" />
        <SText type="cell-meta" :color="alarmed ? 'risk' : 'fg-2'">{{ status }}</SText>
      </span>
    </div>

    <SText type="frame-title" as="h1">
      {{ surname }}<template v-if="area"> — {{ area }}</template>
    </SText>

    <SText type="cell-meta" color="fg-2">
      Quote {{ String(header.id).padStart(4, '0') }} · {{ header.status }} · {{ header.level }}
    </SText>
  </header>
</template>

<style scoped>
.head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px 14px;
  flex: none;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.back {
  text-decoration: none;
  /* The row is 14px tall; the tap target is the phone's. */
  display: flex;
  align-items: center;
  min-height: var(--hit-min);
  margin: calc((var(--hit-min) - 20px) / -2) 0;
}

.back:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.state {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  flex: none;
}

.dot--saved {
  background: var(--color-action);
}

.dot--off {
  background: var(--color-risk);
}
</style>
