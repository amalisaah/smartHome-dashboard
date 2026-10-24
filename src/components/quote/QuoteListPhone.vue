<script setup lang="ts">
import { computed } from 'vue'
import { SButton, SInput, SSegmented, SText } from '@/components/atoms'
import QuoteListRow from './QuoteListRow.vue'
import QuoteListSkeleton from './QuoteListSkeleton.vue'
import QuoteModeBand from './QuoteModeBand.vue'
import { QUOTE_LIST_TABS, type QuoteListTab } from '@/types/quoteList'
import type { useQuoteList } from '@/composables/useQuoteList'

/**
 * D1 — the quote list on a phone (390 × 844).
 *
 * **One scroll, from the title down.** Only the owner band is pinned. The
 * reference pins the header, the search, the tabs and the hint as well, which
 * costs about 255px of an 844px screen before a single quote is on it — the
 * same arithmetic that made the quote builder give up its six pinned bands.
 * Scrolling is how he reads a list; he searches and switches tabs at the top,
 * where these controls still are.
 *
 * It opens on **Waiting**, which is the one question this screen answers:
 * who do I chase? The top row is the answer.
 */
const props = defineProps<{
  list: ReturnType<typeof useQuoteList>
  loading: boolean
  online: boolean
}>()

const emit = defineEmits<{ start: [] }>()

const tabOptions = computed(() =>
  QUOTE_LIST_TABS.map((def) => ({
    label: def.label,
    value: def.id,
    count: props.list.totals.value[def.id],
  })),
)

const tab = computed({
  get: () => props.list.tab.value,
  set: (value: QuoteListTab) => (props.list.tab.value = value),
})

const query = computed({
  get: () => props.list.query.value,
  set: (value: string) => (props.list.query.value = value),
})
</script>

<template>
  <div class="phone">
    <!-- Always on, and there is no way to turn it off. This screen carries no
         cost at all — what makes it his is the other customers' names on it,
         and that is not something he can show her. -->
    <QuoteModeBand phone holding="owner only" />

    <!-- Everything below the band is one scroll. -->
    <div class="page">
      <header class="head">
        <div class="who">
          <SText type="title" as="h1">Quotes</SText>
          <!-- The list on screen is the last one that loaded, and it stays.
               This says so; it does not take anything away. -->
          <span v-if="!online" class="state">
            <span class="dot" />
            <SText type="cell-meta" color="risk">no signal</SText>
          </span>
        </div>

        <!-- G1 opens over this list rather than replacing it: nothing is saved
             until he picks a house, so there is nothing to address. -->
        <SButton size="phone-bar" @click="emit('start')">+ New quote</SButton>
      </header>

      <div class="search">
        <SInput
          v-model="query"
          size="phone"
          placeholder="Name, area or number"
          aria-label="Search quotes by name, area or number"
          enter-key-hint="search"
        />
      </div>

      <div class="tabs">
        <SSegmented v-model="tab" :options="tabOptions" size="phone" />
      </div>

      <SText type="meta" class="hint">{{ list.activeTab.value.hint }}</SText>

      <div class="list">
        <QuoteListSkeleton v-if="loading" device="phone" />

        <template v-else>
          <QuoteListRow
            v-for="row in list.phoneRows.value"
            :key="row.id"
            :row="row"
            device="phone"
          />

          <div v-if="!list.phoneRows.value.length" class="empty">
            <SText type="cell" color="fg-2">{{ list.phoneEmptyText.value }}</SText>
          </div>
        </template>
      </div>
    </div>

    <!-- G1, outside the scroll: it is pinned to the screen, not to the list. -->
    <slot />
  </div>
</template>

<style scoped>
.phone {
  /* What G1's scrim measures from, so it can stop below the mode band. */
  position: relative;
  display: flex;
  flex-direction: column;
  /* The frame is the device: the scroll is inside it, so the band stays put
     and the address bar does not hide the first row. */
  height: 100dvh;
  background: var(--color-bg);
  line-height: normal;
}

/* The one scroll. The band above it is the only thing that does not move. */
.page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

/* Which screen he is on, and the way to start a quote: the two things that are
   true however far down the list he has got. They stick to the top of the
   scroll, directly under the band. The search, the tabs and the hint travel —
   he uses those at the top, where they are.

   An opaque ground, because rows pass underneath it. */
.head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  background: var(--color-bg);
  flex: none;
}

.who {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
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
  background: var(--color-risk);
  flex: none;
}

.search {
  padding: 0 16px 12px;
  flex: none;
}

.tabs {
  padding: 0 16px;
  flex: none;
}

.hint {
  padding: 10px 16px 12px;
  flex: none;
}

/* The rule that separates the controls from the quotes. It travels with them
   now, which is what makes it read as the top of the list rather than as the
   bottom edge of a fixed header. */
.list {
  border-top: 1px solid var(--color-line);
}

.empty {
  padding: 24px 16px;
}
</style>
