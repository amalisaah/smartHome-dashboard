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
  CREATE_FAILED,
  LIST_FAILED,
  NEW_CUSTOMER,
  NEW_HOUSE,
  OFFLINE,
  ROOMS_COME_FROM_THE_HOUSE,
  SEARCH_LABEL,
  SEARCH_PLACEHOLDER,
  STEP_ONE_TITLE,
  STEP_TWO_TITLE,
  TRY_AGAIN,
  noHousesPhone,
  noMatchPhone,
} from '@/data/newQuoteCopy'
import { listLabel } from '@/types/newQuote'

/**
 * G1 — starting a quote on a phone.
 *
 * **One sheet, and its content swaps in place.** Two sheets stacked would make
 * the back gesture ambiguous and would leave the first one's search behind a
 * second scrim; one sheet with two steps keeps `‹ Mensah` as the only way back
 * and the search where he left it.
 *
 * It sits **below the mode band**, like every other sheet on this surface: the
 * one moment he must not be unsure whose view he is in is while he is reaching
 * for the phone, and this sheet is about to put other customers' names on it.
 *
 * Nothing is written until he picks a house. Cancel, the scrim and the back
 * gesture all leave the list exactly as it was — same tab, same search.
 */
const emit = defineEmits<{ close: [] }>()

const router = useRouter()

const g = useNewQuote({
  // The phone's rule: one quotable house has already answered step 2.
  skipSingleHouse: true,
  onCreated: (quoteId) => router.push({ name: 'quote-detail', params: { id: quoteId } }),
})

const sheet = ref<HTMLElement | null>(null)
const field = ref<InstanceType<typeof SInput> | null>(null)
const back = ref<HTMLButtonElement | null>(null)

useDialogKeys(sheet, {
  onDismiss: () => emit('close'),
  initialFocus: () => field.value?.focus(),
})

/**
 * The caret follows the swap. Arriving at step 2 with focus still on a search
 * box that is no longer on screen would leave the next Tab starting from
 * nowhere, and a screen reader announcing a field that had gone.
 */
watch(
  () => g.step.value,
  async (step) => {
    await nextTick()
    if (step === 'house') back.value?.focus()
    else field.value?.focus()
  },
)
</script>

<template>
  <div class="scrim" @mousedown.self="emit('close')">
    <div
      ref="sheet"
      class="sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-quote-title"
    >
      <span class="grabber" aria-hidden="true" />

      <!-- Step 1 · Who's it for? -->
      <template v-if="g.step.value === 'customer'">
        <div class="head">
          <SText id="new-quote-title" type="frame-title" as="h2">{{ STEP_ONE_TITLE }}</SText>
          <SButton variant="ghost" size="md" @click="emit('close')">{{ CANCEL }}</SButton>
        </div>

        <div class="search">
          <SInput
            ref="field"
            v-model="g.query.value"
            size="phone"
            :placeholder="SEARCH_PLACEHOLDER"
            :aria-label="SEARCH_LABEL"
            enter-key-hint="search"
          />
        </div>

        <SText type="micro" class="label">{{ listLabel(g.query.value) }}</SText>

        <div class="list">
          <template v-if="g.failedToLoad.value">
            <div class="say">
              <SText type="cell" color="fg-2">{{ LIST_FAILED }}</SText>
              <SButton variant="secondary" size="lg" @click="g.retryLoad()">{{ TRY_AGAIN }}</SButton>
            </div>
          </template>

          <template v-else>
            <NewQuoteCustomerRow
              v-for="customer in g.matches.value"
              :key="customer.id"
              :customer="customer"
              :counting="g.activeId.value === customer.id && g.countingRooms.value"
              :starting="g.activeId.value === customer.id && g.creating.value"
              @pick="g.pickCustomer(customer.id)"
            />

            <div v-if="!g.loading.value && !g.matches.value.length" class="say">
              <SText type="cell" color="fg-2">{{ noMatchPhone(g.query.value.trim()) }}</SText>
            </div>
          </template>
        </div>

        <div class="foot">
          <p v-if="!g.online.value" class="warn">
            <span class="dot" aria-hidden="true" />
            <SText type="cell-meta" color="risk">{{ OFFLINE }}</SText>
          </p>

          <SButton
            variant="secondary-action"
            size="lg"
            class="wide"
            @click="router.push({ name: 'customer-new' })"
          >
            {{ NEW_CUSTOMER }}
          </SButton>
        </div>
      </template>

      <!-- Step 2 · Which house? -->
      <template v-else>
        <div class="back-row">
          <button ref="back" type="button" class="back" @click="g.backToCustomers()">
            <SText type="cell" color="action" as="span">‹ {{ g.active.value?.name }}</SText>
          </button>
        </div>

        <div class="ask">
          <SText id="new-quote-title" type="frame-title" as="h2">{{ STEP_TWO_TITLE }}</SText>
          <SText type="cell" color="fg-2">{{ ROOMS_COME_FROM_THE_HOUSE }}</SText>
        </div>

        <div class="list">
          <NewQuoteHouseRow
            v-for="house in g.houses.value"
            :key="house.id"
            :house="house"
            :customer-id="g.active.value?.id ?? 0"
            :inert="!g.online.value || g.creating.value"
            @pick="g.create(house.id)"
          />

          <div v-if="!g.houses.value.length" class="say say--wrap">
            <SText type="cell" color="fg-2">{{ noHousesPhone(g.active.value?.name ?? '') }}</SText>
          </div>
        </div>

        <div class="foot">
          <p v-if="!g.online.value || g.failed.value" class="warn">
            <span class="dot" aria-hidden="true" />
            <SText type="cell-meta" color="risk">
              {{ g.online.value ? CREATE_FAILED : OFFLINE }}
            </SText>
          </p>

          <SButton
            variant="secondary-action"
            size="lg"
            class="wide"
            @click="
              router.push({ name: 'house-new', params: { id: g.active.value?.id ?? 0 } })
            "
          >
            {{ NEW_HOUSE }}
          </SButton>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Below the band, never over it. */
.scrim {
  position: absolute;
  inset: var(--band-h) 0 0;
  z-index: 40;
  background: var(--color-scrim);
}

.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 640px;
  display: flex;
  flex-direction: column;
  padding: 8px 0 20px;
  box-sizing: border-box;
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

/* The step swap is a change of subject inside a sheet that is already open, so
   it settles rather than slides — the sheet itself has not moved. */
.head,
.back-row {
  animation: step-in 120ms ease-out;
}

@keyframes step-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet,
  .head,
  .back-row {
    animation: none;
  }
}

.grabber {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-line);
  align-self: center;
  margin-bottom: 10px;
  flex: none;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 8px 0 16px;
  flex: none;
}

.search {
  padding: 10px 16px 14px;
  flex: none;
}

.label {
  padding: 0 16px 6px;
  flex: none;
}

.back-row {
  padding: 0 8px;
  flex: none;
}

/* The way back is a word, not a box: it undoes the tap that got him here. */
.back {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 8px;
  background: none;
  border: none;
  cursor: pointer;
}

.back:hover :deep(.s-text) {
  color: var(--color-action-hover);
}

.back:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
  border-radius: var(--radius-flag);
}

.ask {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 16px 14px;
  flex: none;
}

.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
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

/* The one message here that runs to two lines. */
.say--wrap {
  line-height: 1.5;
}

.foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 0;
  flex: none;
}

/* The same dot the builder's header uses for the same fact. */
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

.wide {
  width: 100%;
}
</style>
