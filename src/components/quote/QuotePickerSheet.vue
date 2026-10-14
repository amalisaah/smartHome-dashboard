<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SInput, SText } from '@/components/atoms'
import { useDialogKeys } from '@/composables/useDialogKeys'
import { formatMoney } from '@/utils/format'
import type { CatalogueItem } from '@/types/catalogue'

/**
 * The item picker, as a bottom sheet.
 *
 * **It stays open.** He is adding four things to a living room, not one, and a
 * sheet that closed on every tap would make him reopen it three times and lose
 * his place in the list each time. The header counts what he has added so he can
 * see the taps landing behind the sheet, and `Done` is the only way out.
 *
 * The sheet sits **below the mode band**, not over it: the band is on every
 * owner-side screen of this surface, including this one, because the one moment
 * he must not be unsure which view he is in is while he is reaching for the
 * phone.
 */
const props = defineProps<{
  roomName: string
  addedCount: number
  results: CatalogueItem[]
  query: string
}>()

const emit = defineEmits<{
  add: [item: CatalogueItem]
  'update:query': [value: string]
  close: []
}>()

const sheet = ref<HTMLElement | null>(null)
const field = ref<InstanceType<typeof SInput> | null>(null)

useDialogKeys(sheet, {
  onDismiss: () => emit('close'),
  initialFocus: () => field.value?.focus(),
})

const label = computed(() =>
  props.addedCount > 0 ? `Adding to · ${props.addedCount} added` : 'Adding to · tap to add',
)

/** `switching · 12 held`, or the amber wait when there are none on the shelf. */
function meta(item: CatalogueItem) {
  const group = item.group?.name ?? 'ungrouped'
  if (item.stock > 0) return { text: `${group} · ${item.stock} held`, short: false }
  const lead = item.leadDays === null ? '' : ` · ${item.leadDays} d`
  return { text: `${group} · not held${lead}`, short: true }
}
</script>

<template>
  <div class="scrim" @mousedown.self="emit('close')">
    <div ref="sheet" class="sheet" role="dialog" aria-modal="true" aria-labelledby="picker-room">
      <div class="head">
        <span class="head-text">
          <SText type="micro">{{ label }}</SText>
          <SText id="picker-room" type="heading" as="h2">{{ roomName }}</SText>
        </span>
        <SButton size="phone-wide" @click="emit('close')">Done</SButton>
      </div>

      <div class="search">
        <SInput
          ref="field"
          :model-value="query"
          size="phone"
          placeholder="Search name or keyword"
          aria-label="Search the catalogue"
          enter-key-hint="search"
          @update:model-value="emit('update:query', $event)"
        />
      </div>

      <div class="results">
        <button
          v-for="item in results"
          :key="item.id"
          type="button"
          class="result"
          @click="emit('add', item)"
        >
          <span class="left">
            <SText type="list-title" as="span">{{ item.name ?? 'Untitled item' }}</SText>
            <SText type="cell-meta" :color="meta(item).short ? 'risk' : 'fg-2'">
              {{ meta(item).text }}
            </SText>
          </span>
          <span class="right">
            <SText type="count">{{ formatMoney(item.sellPricePesewas ?? 0) }}</SText>
            <SText type="cell-meta" color="fg-2">
              cost {{ formatMoney(item.landedCostPesewas) }}
            </SText>
          </span>
        </button>

        <div v-if="results.length === 0" class="empty">
          <SText type="cell" color="fg-2">
            Nothing in the catalogue matches. Add it there first; it isn’t created from a quote.
          </SText>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Below the band, never over it. */
.scrim {
  position: absolute;
  inset: 32px 0 0;
  z-index: 40;
  background: var(--color-scrim);
}

.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 74%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border-top: 1px solid var(--color-line);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  box-shadow: var(--shadow-elev-sheet);
  animation: sheet-up 200ms ease-out;
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet {
    animation: none;
  }
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.head-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.search {
  padding: 0 16px 10px;
}

.results {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid var(--color-line);
  scrollbar-width: thin;
  scrollbar-color: var(--color-line) transparent;
}

.result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  min-height: 56px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-line);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.result:active {
  background: var(--color-match-highlight);
}

.result:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex: none;
}

.empty {
  padding: 24px 16px;
}
</style>
