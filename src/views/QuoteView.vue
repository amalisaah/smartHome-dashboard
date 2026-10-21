<script setup lang="ts">
import { computed } from 'vue'
import QuoteBuilderView from '@/views/QuoteBuilderView.vue'
import QuoteDetailView from '@/views/QuoteDetailView.vue'
import { useQuoteListRows } from '@/api/hooks/quotes'

/**
 * `/quotes/:id` — **one address per quote**, whatever state it is in.
 *
 * What it renders depends on the state, because what he can do to a quote
 * does: a draft is editable and opens the builder, and a quote that has been
 * sent cannot be, so it opens the page that says where it has got to and
 * offers the one thing it needs next.
 *
 * That branch is here rather than in the router because the state is read, not
 * routed on — a navigation guard would have to fetch before it could decide,
 * and the screen would sit blank while it did.
 *
 * An id the list does not know falls through to the builder, which reads the
 * quote itself and carries its own not-found state. That keeps a real quote id
 * reachable at this address while the list is still a fixture.
 */
const props = defineProps<{ quoteId: number }>()

const rowsQuery = useQuoteListRows()

const row = computed(() => rowsQuery.data.value?.find((r) => r.id === props.quoteId) ?? null)
const settled = computed(() => !rowsQuery.isPending.value)
</script>

<template>
  <QuoteDetailView v-if="row && row.status !== 'draft'" :row="row" />
  <QuoteBuilderView v-else-if="settled" :quote-id="quoteId" />
</template>
