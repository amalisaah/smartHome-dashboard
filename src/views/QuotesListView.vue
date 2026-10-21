<script setup lang="ts">
import { computed } from 'vue'
import { SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import QuoteListDesk from '@/components/quote/QuoteListDesk.vue'
import QuoteListPhone from '@/components/quote/QuoteListPhone.vue'
import QuoteModeBand from '@/components/quote/QuoteModeBand.vue'
import { useQuoteListRows } from '@/api/hooks/quotes'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { useQuoteList } from '@/composables/useQuoteList'

/**
 * The quote list — modules 3+4, block D.
 *
 * He opens it to answer one question: **who do I chase?** Everything else on
 * the screen is arranged behind that answer. The phone opens on Waiting;
 * Waiting is the leftmost column on the laptop; and on a sent row the days
 * since he sent it is the largest thing there.
 *
 * **No amount appears anywhere on this list** (gap report B1). Telling two
 * quotes apart is the name, the area, the number and the level — the amount is
 * one tap in, on the quote itself.
 *
 * The view owns the read; `useQuoteList` owns the search and the tab. Below
 * ~900px D1, at ~900px and above D2, and there is no third layout.
 */
const isPhone = useMediaQuery('(max-width: 899px)')
const online = useOnline()

const rowsQuery = useQuoteListRows()
const rows = computed(() => rowsQuery.data.value ?? [])

const list = useQuoteList(rows)

/**
 * `isPending` is "nothing cached yet", so a background revalidation never
 * re-skeletons a list he is already reading.
 */
const loading = computed(() => rowsQuery.isPending.value)

/**
 * A failed read that has nothing cached. With rows cached it says nothing and
 * leaves them up: the last loaded list is still the best answer on screen, and
 * on the phone that is the stated offline behaviour.
 */
const failed = computed(() => rowsQuery.isError.value && !rows.value.length)
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <template v-if="failed">
      <!-- The band stands over the error too: the screen is still his, and the
           next thing on it will have other customers' names on it. -->
      <QuoteModeBand :phone="isPhone" holding="owner only" />
      <div class="failed">
        <SText type="title" as="h1">Quotes</SText>
        <SText type="body" color="fg-2">
          The list of quotes can’t be loaded right now.
        </SText>
        <SButton
          variant="secondary"
          :size="isPhone ? 'lg' : 'md'"
          :loading="rowsQuery.isFetching.value"
          @click="rowsQuery.refetch()"
        >
          Try again
        </SButton>
      </div>
    </template>

    <QuoteListPhone v-else-if="isPhone" :list="list" :loading="loading" :online="online" />

    <template v-else>
      <QuoteModeBand holding="owner only" />
      <QuoteListDesk :list="list" :loading="loading" />
    </template>
  </AppLayout>
</template>

<style scoped>
.failed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 32px 20px;
  max-width: 620px;
}
</style>
