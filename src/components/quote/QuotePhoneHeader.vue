<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { SText } from '@/components/atoms'
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
defineProps<{
  header: QuoteHeader
  surname: string
  area: string | null
  online: boolean
  /** `14:02`, or null before anything has been written this session. */
  savedAt: string | null
}>()
</script>

<template>
  <header class="head">
    <div class="top">
      <RouterLink :to="{ name: 'quotes' }" class="back">
        <SText type="cell" color="fg-2">‹ Quotes</SText>
      </RouterLink>

      <span v-if="online" class="state">
        <span class="dot dot--saved" />
        <SText type="cell-meta" color="fg-2">saved{{ savedAt ? ` · ${savedAt}` : '' }}</SText>
      </span>
      <span v-else class="state">
        <span class="dot dot--off" />
        <SText type="cell-meta" color="risk">no signal · held on phone</SText>
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
