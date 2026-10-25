<script setup lang="ts">
import { computed, ref } from 'vue'
import { SText } from '@/components/atoms'
import AppBar from '@/components/app/AppBar.vue'
import AppTabBar from '@/components/app/AppTabBar.vue'
import QuoteAnswerDialog from './QuoteAnswerDialog.vue'
import QuoteDeskByNeed from './QuoteDeskByNeed.vue'
import QuoteDeskMoneyRail from './QuoteDeskMoneyRail.vue'
import QuoteDeskRail from './QuoteDeskRail.vue'
import QuoteDeskRoomHeader from './QuoteDeskRoomHeader.vue'
import QuoteDeskRow from './QuoteDeskRow.vue'
import QuoteModeBand from './QuoteModeBand.vue'
import QuoteOffRow from './QuoteOffRow.vue'
import { saveState } from '@/composables/useSaveState'
import type { QuoteBuilder } from '@/composables/useQuoteBuilder'
import { quoteNumber, quoteSentLine, type QuoteHeader } from '@/types/quote'

/**
 * A2 — the laptop, his view. The same quote and the same lines as the phone,
 * laid out as a desk: rooms on the left, the table in the middle, money on the
 * right, each column scrolling on its own.
 */
const props = defineProps<{
  builder: QuoteBuilder
  header: QuoteHeader
  surname: string
  area: string | null
  online: boolean
  savedAt: string | null
  /** Her answer is being written. */
  answering?: boolean
  answerError?: string | null
  /** `Mark sent` is in flight, and what came back if it was refused. */
  sending?: boolean
  sendError?: string | null
}>()

defineEmits<{
  send: []
  accept: [agreedTotalPesewas: number]
  decline: [reason: string | null]
  later: []
}>()

const b = props.builder
const query = ref('')

const results = computed(() => (query.value.trim() ? b.search(query.value) : []))

/**
 * What the app bar says. Offline outranks everything; after that it reports the
 * actual write state rather than assuming the last one worked — it used to read
 * "saved" seconds after a submit had failed.
 */
const status = computed(() => {
  if (!props.online) return 'no signal · held on this laptop'
  if (saveState.value === 'saving') return 'submitting…'
  if (saveState.value === 'failed') return 'not submitted'
  if (b.dirty.value) return 'unsubmitted changes'
  return `saved${props.savedAt ? ` · ${props.savedAt}` : ''}`
})

const alarmed = computed(() => !props.online || saveState.value === 'failed')

/** `Adjei — East Legon`, as both the rail and the dialog's header say it. */
const who = computed(() =>
  props.area ? `${props.surname} — ${props.area}` : props.surname,
)
</script>

<template>
  <div class="desk">
    <QuoteModeBand />
    <AppBar :status="status" :alarmed="alarmed" />
    <AppTabBar />

    <div class="body">
      <QuoteDeskRail
        :header="header"
        :surname="surname"
        :area="area"
        :rooms="b.summaries.value"
        :active-id="b.activeRoomId.value"
        :group-by="b.groupBy.value"
        @select="b.selectRoom"
        @update:group-by="b.groupBy.value = $event"
      />

      <main class="centre">
        <template v-if="b.groupBy.value === 'room'">
          <QuoteDeskRoomHeader
            :room="b.activeRoom.value"
            :results="results"
            :query="query"
            :off-count="b.offCount.value"
            :show-off="b.showOff.value"
            :toast="b.toast.value"
            :editable="b.editable.value"
            @update:query="query = $event"
            @add="b.add"
            @toggle-off="b.showOff.value = !b.showOff.value"
          />

          <!-- Not `table`: that is a Tailwind utility (`display: table`), and a
               table box ignores `overflow` in Chrome and shrink-wraps to its
               content — which is how this spilled under the money rail. -->
          <div class="desk-table">
            <div class="thead">
              <SText type="column-header">Item</SText>
              <SText type="column-header">Need</SText>
              <SText type="column-header" class="mid">Qty</SText>
              <SText type="column-header" class="end">Total</SText>
              <SText type="column-header" color="risk" class="end">Cost · owner</SText>
              <SText type="column-header">Note</SText>
              <span />
            </div>

            <QuoteDeskRow
              v-for="line in b.roomLines.value"
              :key="line.id"
              :line="line"
              :default-need="b.defaultNeedFor(line.itemId)"
              :editable="b.editable.value"
              @step="b.step(line.id, $event)"
              @need="b.setNeed(line.id, $event)"
              @note="b.setNote(line.id, $event)"
              @off="b.switchOff(line.id)"
            />

            <div v-if="b.roomLines.value.length === 0" class="empty">
              <SText type="cell" color="fg-2">
                Nothing in {{ b.activeRoom.value?.name ?? 'this room' }} yet. Start typing above.
              </SText>
            </div>

            <template v-if="b.showOff.value">
              <QuoteOffRow
                v-for="line in b.roomOffLines.value"
                :key="line.id"
                :line="line"
                :editable="b.editable.value"
                @on="b.switchOn(line.id)"
              />
            </template>
          </div>
        </template>

        <QuoteDeskByNeed v-else :lines="b.lines.value" />
      </main>

      <QuoteDeskMoneyRail
        v-if="b.money.value"
        :money="b.money.value"
        :charges="b.charges.value"
        :itemised="b.itemised.value"
        :labour-missing="b.labourMissing.value"
        :editing="b.editable.value"
        :dirty="b.dirty.value"
        :change-count="b.changeCount.value"
        :submitting="b.submitting.value"
        :submit-error="b.submitError.value"
        :header="header"
        :locked="b.locked.value"
        :sending="sending"
        :send-error="sendError"
        @edit="b.startEditing"
        @reset="b.reset"
        @submit="b.submit"
        @charge="b.setCharge"
        @update:itemised="b.itemised.value = $event"
        @her="b.showHer"
        @send="$emit('send')"
        @answer="b.answerOpen.value = true"
      />
    </div>

    <!-- B3. The same question as the phone's sheet, as a dialog over the
         frozen quote — which stays legible behind it, so a line can be read
         back to her while she is still on the phone. -->
    <QuoteAnswerDialog
      v-if="b.answerOpen.value && b.money.value"
      :who="who"
      :sent-line="quoteSentLine(header)"
      :quote-label="`Quote ${quoteNumber(header.id)}`"
      :proposed-pesewas="b.money.value.proposedPesewas"
      :floor-pesewas="b.money.value.costPesewas"
      :online="online"
      :busy="answering"
      :error="answerError"
      @accept="$emit('accept', $event)"
      @decline="$emit('decline', $event)"
      @later="$emit('later')"
    />
  </div>
</template>

<style scoped>
.desk {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 320px;
  flex: 1;
  min-height: 0;
}

.centre {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.desk-table {
  /* Block, explicitly. The class is scoped, but `display` is what the Tailwind
     `table` utility was setting, and a block container is what makes `overflow`
     mean anything at all here. */
  display: block;
  flex: 1;
  min-height: 0;
  /* Both axes. On a 1280px laptop the centre column is ~740px — narrower than
     the floor below — so the table scrolls sideways rather than pushing its
     last columns out under the money rail. */
  overflow: auto;
  /* It scrolls, but it does not draw a bar: the rail beside it and the rows
     under it are the frame, and a gutter cutting across both is noise. Firefox
     and old Edge take a property; Chrome and Safari take the pseudo-element
     below. Wheel, trackpad, shift-wheel and the keyboard all still scroll it. */
  scrollbar-width: none;
  -ms-overflow-style: none;

  /* The row grid, declared once here and inherited by every row in the table —
     the head, a line, a switched-off line. One place to change a column. */
  --desk-cols: minmax(200px, 2fr) 120px 120px 96px 80px minmax(160px, 1fr) 84px;
  /* The floor is the sum of the tracks' own minimums — 200 + 120 + 120 + 96 +
     80 + 160 + 84 — plus six 12px gaps and 24px of padding each side. It counts
     the note's 160px, because a note column squeezed to nothing is not a
     narrower table, it is a lost column: below this width the table scrolls. */
  --desk-min: 980px;
}

.desk-table::-webkit-scrollbar {
  display: none;
}

.thead {
  display: grid;
  grid-template-columns: var(--desk-cols);
  min-width: var(--desk-min);
  gap: 12px;
  padding: 10px 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
  /* Vertically sticky only — it travels with the rows when they scroll
     sideways, which is the whole point of a column header. */
  position: sticky;
  top: 0;
  z-index: 1;
}

.mid {
  text-align: center;
}

.end {
  text-align: right;
}

.empty {
  min-width: var(--desk-min);
  padding: 32px 24px;
}
</style>
