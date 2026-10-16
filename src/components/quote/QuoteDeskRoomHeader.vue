<script setup lang="ts">
import { computed, ref } from 'vue'
import { SText } from '@/components/atoms'
import QuoteOffToggle from './QuoteOffToggle.vue'
import { formatMoney } from '@/utils/format'
import type { CatalogueItem } from '@/types/catalogue'
import type { QuoteRoomSummary } from '@/types/quote'

/**
 * The room, and the way things get into it.
 *
 * **The keyboard replaces the sheet.** He types, Enter adds the top match, and
 * the field keeps both the query and the focus so Enter again adds another —
 * which is the desk equivalent of the phone's picker staying open. Esc clears.
 *
 * Nothing is created from here. A name the catalogue does not have is a gap in
 * the catalogue, and inventing an item mid-quote would put a price on the record
 * that nobody costed.
 */
const props = defineProps<{
  room: QuoteRoomSummary | null
  results: CatalogueItem[]
  query: string
  offCount: number
  showOff: boolean
  toast: string
  /** False while the quote is being read rather than changed. */
  editable?: boolean
}>()

const emit = defineEmits<{
  add: [item: CatalogueItem]
  'update:query': [value: string]
  toggleOff: []
}>()

const field = ref<HTMLInputElement | null>(null)

const roomName = computed(() => props.room?.name ?? 'the quote')

const open = computed(() => props.query.trim().length > 0)

const summary = computed(() => {
  if (!props.room) return ''
  const count = props.room.lineCount
  const lines = `${count} line${count === 1 ? '' : 's'}`
  return count ? `${lines} · ${formatMoney(props.room.totalPesewas)}` : lines
})

/**
 * Adding never costs him the field. Enter keeps focus by itself; a click on a
 * result would take it to the button, so it is handed straight back — the query
 * stays, and the next Enter adds the next one.
 */
function add(item: CatalogueItem) {
  emit('add', item)
  field.value?.focus()
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    const top = props.results[0]
    // Enter on nothing is not an error, it is a typo he is still fixing.
    if (top) add(top)
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('update:query', '')
  }
}

/** `switching` / `12 held` / `not held · 21 d lead`. */
function stock(item: CatalogueItem) {
  if (item.stock > 0) return { text: `${item.stock} held`, short: false }
  const lead = item.leadDays === null ? '' : ` · ${item.leadDays} d lead`
  return { text: `not held${lead}`, short: true }
}
</script>

<template>
  <div class="head">
    <div class="top">
      <span class="title">
        <SText type="title" as="h2">{{ roomName }}</SText>
        <SText type="list-meta" color="fg-2">{{ summary }}</SText>
      </span>
      <QuoteOffToggle :count="offCount" :showing="showOff" @toggle="emit('toggleOff')" />
    </div>

    <div v-if="editable" class="add">
      <input
        ref="field"
        class="field"
        type="text"
        :value="query"
        :placeholder="`Add to ${roomName} — type a name or keyword, Enter adds the top match`"
        :aria-label="`Add an item to ${roomName}`"
        @input="emit('update:query', ($event.target as HTMLInputElement).value)"
        @keydown="onKeyDown"
      />
      <SText v-if="toast" type="list-meta" color="action" class="toast">✓ {{ toast }}</SText>
    </div>

    <div v-if="open && editable" class="results">
      <button
        v-for="item in results"
        :key="item.id"
        type="button"
        class="result"
        @click="add(item)"
      >
        <SText type="ui" as="span" class="name">{{ item.name ?? 'Untitled item' }}</SText>
        <SText type="cell-meta" color="fg-2">{{ item.group?.name ?? 'ungrouped' }}</SText>
        <SText type="cell-meta" :color="stock(item).short ? 'risk' : 'fg-2'">
          {{ stock(item).text }}
        </SText>
        <SText type="ref" class="figure">{{ formatMoney(item.sellPricePesewas ?? 0) }}</SText>
        <SText type="list-meta" color="risk" class="figure">
          {{ formatMoney(item.landedCostPesewas) }}
        </SText>
      </button>

      <div v-if="results.length === 0" class="none">
        <SText type="cell" color="fg-2">
          Nothing in the catalogue matches. Add it there first; it isn’t created from a quote.
        </SText>
      </div>
    </div>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px 14px;
  border-bottom: 1px solid var(--color-line);
  position: relative;
  flex: none;
}

.top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.add {
  display: flex;
  align-items: center;
  gap: 10px;
}

.field {
  flex: 1;
  min-width: 0;
  font-family: var(--font-sans);
  font-size: 15px;
  color: var(--color-fg);
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: 11px 14px;
  transition: border-color 120ms ease-out;
}

.field::placeholder {
  color: var(--color-fg-3);
}

.field:hover {
  border-color: var(--color-fg-3);
}

.field:focus {
  border-color: var(--color-action);
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.toast {
  white-space: nowrap;
}

.results {
  position: absolute;
  left: 24px;
  right: 24px;
  top: 100%;
  margin-top: -8px;
  max-height: 360px;
  overflow-y: auto;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-2);
  z-index: 3;
}

.result {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 150px 90px 90px;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-divider);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.result:hover {
  background: var(--color-surface);
}

.result:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.name {
  min-width: 0;
}

.figure {
  text-align: right;
}

.none {
  padding: 14px;
}
</style>
