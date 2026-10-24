<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import NewQuoteDialog from '@/components/quote/NewQuoteDialog.vue'
import NewQuoteSheet from '@/components/quote/NewQuoteSheet.vue'
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

/**
 * Block G, open over this list — a sheet on the phone, a dialog on the laptop.
 *
 * It is state on this view rather than a route of its own, which is the whole
 * design: nothing is saved until he picks a house, so there is no record to
 * address and nothing for a back gesture to mean. Closing it leaves the list on
 * the tab and the search it already had, because the list never went anywhere.
 */
const starting = ref(false)
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

    <template v-else-if="isPhone">
      <QuoteListPhone
        :list="list"
        :loading="loading"
        :online="online"
        @start="starting = true"
      >
        <NewQuoteSheet v-if="starting" @close="starting = false" />
      </QuoteListPhone>
    </template>

    <template v-else>
      <QuoteModeBand holding="owner only" />
      <div class="desk">
        <QuoteListDesk :list="list" :loading="loading" @start="starting = true" />
        <NewQuoteDialog v-if="starting" @close="starting = false" />
      </div>
    </template>
  </AppLayout>
</template>

<style scoped>
/* The positioned ancestor G2's scrim covers. It is this wrapper rather than the
   layout's frame so the scrim stops at the mode band, which stays legible over
   it — the band is on every owner-side screen, including behind an open one. */
.desk {
  position: relative;
}

.failed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 32px 20px;
  max-width: 620px;
}
</style>
