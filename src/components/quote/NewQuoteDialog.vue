<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { SButton, SInput, SText } from '@/components/atoms'
import NewQuoteCustomerRow from './NewQuoteCustomerRow.vue'
import NewQuoteHouseRow from './NewQuoteHouseRow.vue'
import { useDialogKeys } from '@/composables/useDialogKeys'
import { useNewQuote } from '@/composables/useNewQuote'
import {
  CANCEL,
  COLUMN_ONE_TITLE,
  COLUMN_TWO_TITLE,
  CREATE_FAILED,
  DIALOG_TITLE,
  LIST_FAILED,
  NEW_CUSTOMER,
  NEW_HOUSE,
  NO_HOUSES_DESK,
  OFFLINE,
  PICK_A_CUSTOMER_FIRST,
  SEARCH_LABEL,
  SEARCH_PLACEHOLDER,
  TRY_AGAIN,
  housesSubline,
  noMatchDesk,
} from '@/data/newQuoteCopy'
import { listLabel } from '@/types/newQuote'

/**
 * G2 — starting a quote on a laptop.
 *
 * **Both steps side by side, always.** The width allows it, so the houses
 * appear the moment a customer is picked and changing his mind is one click
 * rather than a step back. That is also why the phone's one-house skip is off
 * here: there is no second step to save him, only a column that would flash and
 * vanish under the cursor.
 *
 * The whole flow is reachable from the keys — type, ↑ ↓, Enter, ↑ ↓, Enter —
 * because this is the screen he uses sitting down, with a customer on the
 * phone and both hands already on the keyboard.
 */
const emit = defineEmits<{ close: [] }>()

const router = useRouter()

const g = useNewQuote({
  skipSingleHouse: false,
  onCreated: (quoteId) => router.push({ name: 'quote-detail', params: { id: quoteId } }),
})

const dialog = ref<HTMLElement | null>(null)
const field = ref<InstanceType<typeof SInput> | null>(null)
const left = ref<HTMLElement | null>(null)
const right = ref<HTMLElement | null>(null)

useDialogKeys(dialog, {
  onDismiss: () => emit('close'),
  initialFocus: () => field.value?.focus(),
})

/** The rows of one column, in the order they are drawn, minus the inert ones. */
const rowsOf = (column: HTMLElement | null) =>
  Array.from(column?.querySelectorAll<HTMLElement>('[data-row]:not(:disabled)') ?? [])

/**
 * ↑ ↓ walk the column the caret is already in. Enter needs no handler: every
 * row is a button, so the browser's own Enter is the pick — which is also what
 * keeps the mouse and the keys from ever disagreeing about what a row does.
 */
function onArrow(event: KeyboardEvent, column: HTMLElement | null) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

  const rows = rowsOf(column)
  if (!rows.length) return

  event.preventDefault()
  const at = rows.indexOf(document.activeElement as HTMLElement)
  const step = event.key === 'ArrowDown' ? 1 : -1

  // From the search box, ↓ enters the list and ↑ stays put: there is nothing
  // above the first row, and wrapping to the bottom of a list he has not read
  // yet would be a jump rather than a move.
  if (at === -1) {
    if (step === 1) rows[0].focus()
    return
  }

  // At the top, ↑ returns to the search, which is where the list came from.
  if (at === 0 && step === -1) {
    field.value?.focus()
    return
  }

  rows[Math.min(rows.length - 1, Math.max(0, at + step))].focus()
}

/**
 * Enter on a customer moves the caret across to her houses — the handoff's
 * "Enter picks one and moves focus to the houses".
 *
 * Only when the pick came from the keys. A click already put the cursor where
 * he wanted it, and dragging focus out from under a mouse user would make the
 * next click land somewhere he was not looking.
 */
const viaKeys = ref(false)

watch([() => g.activeId.value, () => g.countingRooms.value], async ([, counting]) => {
  if (!viaKeys.value || counting || g.activeId.value === null) return
  await nextTick()
  const [first] = rowsOf(right.value)
  if (first) first.focus()
  viaKeys.value = false
})
</script>

<template>
  <div class="scrim" @mousedown.self="emit('close')">
    <div
      ref="dialog"
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-quote-title"
    >
      <div class="head">
        <SText id="new-quote-title" type="frame-title" as="h2">{{ DIALOG_TITLE }}</SText>

        <SButton variant="ghost" size="sm" class="cancel" @click="emit('close')">
          <span class="key" aria-hidden="true">Esc</span>
          {{ CANCEL }}
        </SButton>
      </div>

      <div class="body">
        <!-- 1 · Who's it for? -->
        <section
          ref="left"
          class="col col--left"
          @keydown="onArrow($event, left)"
          @keydown.enter="viaKeys = true"
        >
          <div class="col-head">
            <SText type="ui" as="h3">{{ COLUMN_ONE_TITLE }}</SText>
            <SInput
              ref="field"
              v-model="g.query.value"
              :placeholder="SEARCH_PLACEHOLDER"
              :aria-label="SEARCH_LABEL"
            />
          </div>

          <SText type="micro" class="label">{{ listLabel(g.query.value) }}</SText>

          <div class="rows">
            <template v-if="g.failedToLoad.value">
              <div class="say">
                <SText type="cell" color="fg-2">{{ LIST_FAILED }}</SText>
                <SButton variant="secondary" size="md" @click="g.retryLoad()">
                  {{ TRY_AGAIN }}
                </SButton>
              </div>
            </template>

            <template v-else>
              <NewQuoteCustomerRow
                v-for="customer in g.matches.value"
                :key="customer.id"
                data-row
                :customer="customer"
                :picked="g.activeId.value === customer.id"
                :counting="g.activeId.value === customer.id && g.countingRooms.value"
                @pick="g.pickCustomer(customer.id)"
              />

              <div v-if="!g.loading.value && !g.matches.value.length" class="say">
                <SText type="cell" color="fg-2">{{ noMatchDesk(g.query.value.trim()) }}</SText>
              </div>
            </template>
          </div>

          <div class="col-foot">
            <button type="button" class="link" @click="router.push({ name: 'customer-new' })">
              <SText type="cell" color="action" as="span">{{ NEW_CUSTOMER }}</SText>
            </button>
          </div>
        </section>

        <!-- 2 · Which house? -->
        <section
          ref="right"
          class="col"
          :class="{ 'col--waiting': !g.active.value }"
          @keydown="onArrow($event, right)"
        >
          <div class="col-head col-head--tight">
            <SText type="ui" :color="g.active.value ? undefined : 'fg-3'" as="h3">
              {{ COLUMN_TWO_TITLE }}
            </SText>
            <SText type="meta" color="fg-2">
              {{ g.active.value ? housesSubline(g.active.value.name) : PICK_A_CUSTOMER_FIRST }}
            </SText>
          </div>

          <template v-if="g.active.value">
            <div class="rows">
              <NewQuoteHouseRow
                v-for="house in g.houses.value"
                :key="house.id"
                data-row
                :house="house"
                :customer-id="g.active.value.id"
                :inert="!g.online.value || g.creating.value"
                @pick="g.create(house.id)"
              />

              <div v-if="!g.houses.value.length" class="say say--wrap">
                <SText type="cell" color="fg-2">{{ NO_HOUSES_DESK }}</SText>
              </div>
            </div>

            <div class="col-foot col-foot--plain">
              <p v-if="!g.online.value || g.failed.value" class="warn">
                <span class="dot" aria-hidden="true" />
                <SText type="cell-meta" color="risk">
                  {{ g.online.value ? CREATE_FAILED : OFFLINE }}
                </SText>
              </p>

              <button
                type="button"
                class="link"
                @click="
                  router.push({ name: 'house-new', params: { id: g.active.value.id } })
                "
              >
                <SText type="cell" color="action" as="span">{{ NEW_HOUSE }}</SText>
              </button>
            </div>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrim {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: var(--color-scrim);
}

/* 96px down rather than centred: the dialog opens below the list's title row,
   so the screen it came from is still legible around it. */
.dialog {
  position: absolute;
  left: 50%;
  top: 96px;
  transform: translateX(-50%);
  width: 800px;
  max-width: calc(100% - 48px);
  height: 560px;
  max-height: calc(100% - 144px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-2);
  animation: dialog-in 200ms ease-out;
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dialog {
    animation: none;
  }
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 12px 14px 24px;
  border-bottom: 1px solid var(--color-line);
  flex: none;
}

/* The key that does the same thing, drawn as a key. */
.key {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-flag);
}

.cancel {
  gap: 8px;
}

.body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-bg);
  transition: background-color 120ms ease-out;
}

.col--left {
  border-right: 1px solid var(--color-line);
}

/* Nothing has been asked of this column yet, so it is not a live surface. */
.col--waiting {
  background: var(--color-surface);
}

.col-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 24px 14px;
  flex: none;
}

/* The right column's two lines are a heading and its own sub-line, not a label
   over a field: they sit closer together. */
.col-head--tight {
  gap: 4px;
}

.label {
  padding: 0 24px 6px;
  flex: none;
}

.rows {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px;
  border-top: 1px solid var(--color-line);
  scrollbar-width: thin;
  scrollbar-color: var(--color-line) transparent;
}

.say {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 16px;
}

.say--wrap {
  line-height: 1.5;
}

.col-foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid var(--color-line);
  flex: none;
}

/* The right column's footer follows its rows rather than closing the column:
   the rule above it would be a second line under the one the rows already end
   with. */
.col-foot--plain {
  border-top: none;
}

/* A word that goes somewhere, in the row it belongs to. */
.link {
  align-self: flex-start;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.link:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}

.warn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: var(--color-risk);
  flex: none;
}
</style>
