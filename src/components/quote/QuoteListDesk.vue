<script setup lang="ts">
import { computed } from 'vue'
import { SButton, SInput, SText } from '@/components/atoms'
import QuoteListColumn from './QuoteListColumn.vue'
import type { useQuoteList } from '@/composables/useQuoteList'

/**
 * D2 — the quote list on a laptop (1440).
 *
 * The same three states the phone tabs between, side by side, left to right in
 * the order he acts on them: **Waiting on her · Drafts · Answered**. Nothing is
 * hidden behind a tab here, because there is room not to hide it.
 *
 * One search filters all three columns at once. The alternative — a search per
 * column — would make finding one quote three attempts when he does not
 * remember which state it is in, which is precisely when he searches.
 */
const props = defineProps<{
  list: ReturnType<typeof useQuoteList>
  loading: boolean
}>()

const emit = defineEmits<{ start: [] }>()

const query = computed({
  get: () => props.list.query.value,
  set: (value: string) => (props.list.query.value = value),
})
</script>

<template>
  <div class="body">
    <div class="title-row">
      <div class="who">
        <SText type="title" as="h1">Quotes</SText>
        <SText type="list-meta" color="fg-2">{{ list.summary.value }}</SText>
      </div>

      <div class="controls">
        <div class="search">
          <SInput
            v-model="query"
            placeholder="Name, area or number"
            aria-label="Search quotes by name, area or number"
          />
        </div>
        <!-- G2 opens over this list rather than replacing it: nothing is saved
             until he picks a house, so there is nothing to address. -->
        <SButton size="toolbar" @click="emit('start')">+ New quote</SButton>
      </div>
    </div>

    <div class="columns">
      <QuoteListColumn
        v-for="column in list.columns.value"
        :key="column.def.id"
        :column="column"
        :empty-text="list.columnEmptyText(column)"
        :loading="loading"
      />
    </div>
  </div>
</template>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 32px 32px;
}

/* Aligned to the bottom, so the search and the button sit on the title's
   baseline rather than floating above the summary line under it. */
.title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.who {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search {
  width: 300px;
  max-width: 100%;
}

/* `minmax(0, 1fr)` rather than `1fr`: a long household name would otherwise
   widen its column and leave the other two narrower than each other. */
.columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

/* Between the phone's breakpoint and a narrow laptop the three columns still
   fit, but the title row's controls do not share its line. They wrap; the
   columns do not, because the three-abreast comparison is the layout. */
@media (max-width: 1100px) {
  .body {
    padding: 24px 24px 32px;
  }

  .columns {
    gap: 16px;
  }
}
</style>
