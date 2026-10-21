<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { SBadge, SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import QuoteModeBand from '@/components/quote/QuoteModeBand.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { quoteRowSubtitle, type QuoteListRow } from '@/types/quoteList'

/**
 * One quote that is no longer a draft — sent, accepted or declined.
 *
 * A draft opens the builder; these three cannot be edited, so they get a page
 * that **says where the quote has got to and offers the one thing it needs
 * next**. That action is the whole point of the page: a sent quote's is
 * recording her answer, an accepted one's is its job, and a declined one has
 * none, because it is recorded and there is nothing to do about it.
 *
 * The lines themselves are block B's and block C's to draw. What is real here
 * is the identity, the state and the way on.
 */
const props = defineProps<{ row: QuoteListRow }>()

const isPhone = useMediaQuery('(max-width: 899px)')
const router = useRouter()

const name = computed(() => `${props.row.surname} — ${props.row.area}`)

/** The state in words, in the chip vocabulary the list uses for the same fact. */
const state = computed(() => {
  const row = props.row
  if (row.status === 'sent') {
    return {
      variant: 'quoted' as const,
      text: `sent · ${row.daysWaiting} ${row.daysWaiting === 1 ? 'day' : 'days'} waiting`,
    }
  }
  if (row.status === 'accepted') {
    return { variant: 'outcome-accepted' as const, text: `accepted ${row.answeredOn}` }
  }
  return { variant: 'outcome-declined' as const, text: `declined ${row.answeredOn}` }
})

/**
 * What this quote needs next. A declined quote has no action — offering one
 * would invent a way to argue with her answer.
 */
const action = computed(() => {
  const row = props.row
  if (row.status === 'sent') {
    return { label: 'Record her answer', to: { name: 'quote-answer', params: { id: row.id } } }
  }
  if (row.status === 'accepted' && row.jobNumber) {
    return {
      label: `Open job ${row.jobNumber}`,
      to: { name: 'job-detail', params: { id: Number(row.jobNumber) } },
    }
  }
  return null
})

const size = computed(() => (isPhone.value ? 'lg' : 'md') as 'lg' | 'md')
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <!-- Her name is on this screen, so the band is on it too. -->
    <QuoteModeBand :phone="isPhone" holding="owner only" />

    <div class="quote">
      <RouterLink :to="{ name: 'quotes' }" class="back">
        <SText type="cell" color="fg-2">‹ Quotes</SText>
      </RouterLink>

      <header class="head">
        <SText :type="isPhone ? 'title' : 'frame-title'" as="h1">{{ name }}</SText>
        <SText type="cell-meta" color="fg-2">{{ quoteRowSubtitle(row) }}</SText>
        <div class="state">
          <SBadge :variant="state.variant" size="inline">{{ state.text }}</SBadge>
        </div>
      </header>

      <!-- Only when he wrote one down. -->
      <SText v-if="row.declinedReason" type="body" class="reason">
        “{{ row.declinedReason }}”
      </SText>

      <div class="lines">
        <SText type="micro">not in this handoff</SText>
        <SText type="body" color="fg-2">
          What she was quoted, line by line. A sent quote shows it beside what she agreed to
          (block B); an accepted one shows it on the job (block C).
        </SText>
      </div>

      <div class="actions">
        <SButton v-if="action" :size="size" @click="router.push(action.to)">
          {{ action.label }}
        </SButton>
        <SButton variant="secondary" :size="size" @click="router.push({ name: 'quotes' })">
          Back to the quotes
        </SButton>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.quote {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px 32px;
  max-width: 620px;
}

.back {
  text-decoration: none;
  /* The line is 14px tall; the tap target is the phone's. */
  display: flex;
  align-items: center;
  min-height: var(--hit-min);
  margin: calc((var(--hit-min) - 20px) / -2) 0;
}

.back:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.state {
  padding-top: 4px;
}

.reason {
  font-style: italic;
  color: var(--color-fg-2);
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
}
</style>
