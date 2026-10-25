<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SSegmented, SText } from '@/components/atoms'
import QuoteAddedToast from './QuoteAddedToast.vue'
import QuoteAnswerSheet from './QuoteAnswerSheet.vue'
import QuoteEditBar from './QuoteEditBar.vue'
import QuoteLockedBar from './QuoteLockedBar.vue'
import QuoteModeBand from './QuoteModeBand.vue'
import QuoteMoneySheet from './QuoteMoneySheet.vue'
import QuoteOffRow from './QuoteOffRow.vue'
import QuoteOffToggle from './QuoteOffToggle.vue'
import QuotePhoneByNeed from './QuotePhoneByNeed.vue'
import QuotePhoneHeader from './QuotePhoneHeader.vue'
import QuotePhoneLineRow from './QuotePhoneLineRow.vue'
import QuotePhoneMoneyBar from './QuotePhoneMoneyBar.vue'
import QuotePhoneSendRow from './QuotePhoneSendRow.vue'
import QuotePickerSheet from './QuotePickerSheet.vue'
import QuoteRoomChips from './QuoteRoomChips.vue'
import { formatMoney } from '@/utils/format'
import type { QuoteBuilder } from '@/composables/useQuoteBuilder'
import type { QuoteHeader } from '@/types/quote'

/**
 * A1 — the phone, his view.
 *
 * Top to bottom: the band, the header, the controls, the room chips, the list,
 * and the money bar. The band and the money bar never move and never leave, not
 * even behind a sheet: the first says which audience is looking and the second
 * says what the quote comes to, and both are true the whole time.
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

const GROUP_OPTIONS = [
  { label: 'By room', value: 'room' as const },
  { label: 'By need', value: 'need' as const },
]

const results = computed(() => b.search(query.value))
</script>

<template>
  <div class="phone" :class="{ 'phone--answering': b.answerOpen.value }">
    <QuoteModeBand phone />

    <!-- One scroll, from the household name down to Show her. Pinning six bands
         around the list left it 445px of an 844px screen — under four rows —
         so everything but the band travels with the list now. -->
    <div class="page">
      <QuotePhoneHeader
        :header="header"
        :surname="surname"
        :area="area"
        :online="online"
        :saved-at="savedAt"
        :dirty="b.dirty.value"
      />

      <div class="controls">
        <div class="seg">
          <SSegmented v-model="b.groupBy.value" :options="GROUP_OPTIONS" size="lg" />
        </div>
        <QuoteOffToggle
          phone
          :count="b.offCount.value"
          :showing="b.showOff.value"
          @toggle="b.showOff.value = !b.showOff.value"
        />
      </div>

      <QuoteRoomChips
        v-if="b.groupBy.value === 'room'"
        :rooms="b.summaries.value"
        :active-id="b.activeRoomId.value"
        @select="b.selectRoom"
      />

      <div class="list">
        <template v-if="b.groupBy.value === 'room'">
          <!-- Sticky, because the one question a tap on + Add must never raise
               is "which room is this going into". It is the only thing besides
               the band that holds its place now. -->
          <div class="adding">
            <span class="adding-text">
              <SText type="micro" color="fg-3">Adding to</SText>
              <SText type="heading" as="h2">{{ b.activeRoom.value?.name ?? 'the quote' }}</SText>
            </span>
            <SButton v-if="b.editable.value" size="phone-wide" @click="b.openPicker">+ Add</SButton>
          </div>

          <QuotePhoneLineRow
            v-for="line in b.roomLines.value"
            :key="line.id"
            :line="line"
            :default-need="b.defaultNeedFor(line.itemId)"
            :expanded="b.expandedLineId.value === line.id"
            :editable="b.editable.value"
            @toggle="b.toggleLine(line.id)"
            @step="b.step(line.id, $event)"
            @need="b.setNeed(line.id, $event)"
            @note="b.setNote(line.id, $event)"
            @off="b.switchOff(line.id)"
          />

          <div v-if="b.roomLines.value.length === 0" class="empty">
            <SText type="cell" color="fg-2">
              Nothing in {{ b.activeRoom.value?.name ?? 'this room' }} yet.{{ b.editable.value ? ' Tap + Add.' : '' }}
            </SText>
          </div>

          <template v-if="b.showOff.value">
            <QuoteOffRow
              v-for="line in b.roomOffLines.value"
              :key="line.id"
              :line="line"
              phone
              :editable="b.editable.value"
              @on="b.switchOn(line.id)"
            />
          </template>

          <SText type="micro" color="fg-3" class="other-label">Other rooms</SText>
          <button
            v-for="room in b.otherRooms.value"
            :key="room.id"
            type="button"
            class="other"
            @click="b.selectRoom(room.id)"
          >
            <SText type="cell" as="span" class="other-name">
              {{ room.name }}
              <SText type="cell-meta" as="span" class="other-meta">
                ·
                {{ room.lineCount ? `${room.lineCount} line${room.lineCount === 1 ? '' : 's'}` : 'empty' }}
              </SText>
            </SText>
            <SText type="money" class="other-total">
              {{ room.lineCount ? formatMoney(room.totalPesewas) : '' }}
            </SText>
          </button>
        </template>

        <QuotePhoneByNeed v-else :lines="b.lines.value" />
      </div>

      <div class="edit">
        <!-- A sent quote has no way into editing, so the bar says where it has
             got to and offers the one thing it needs next instead. -->
        <QuoteLockedBar
          v-if="b.locked.value"
          phone
          :header="header"
          @answer="b.answerOpen.value = true"
        />

        <template v-else>
          <QuoteEditBar
            phone
            :editing="b.editable.value"
            :dirty="b.dirty.value"
            :change-count="b.changeCount.value"
            :submitting="b.submitting.value"
            :error="b.submitError.value"
            @edit="b.startEditing"
            @reset="b.reset"
            @submit="b.submit"
          />

          <!-- Under the edit bar, as it is on the laptop: the last thing he does
               to a draft, below the ways of changing one. -->
          <QuotePhoneSendRow
            :labour-missing="b.labourMissing.value"
            :sending="sending"
            :error="sendError"
            @send="$emit('send')"
          />
        </template>
      </div>

      <QuotePhoneMoneyBar
        v-if="b.money.value"
        :money="b.money.value"
        :labour-missing="b.labourMissing.value"
        @money="b.moneyOpen.value = true"
        @her="b.showHer"
      />
    </div>

    <!-- Outside the scroll: it is pinned to the screen, not to the document. -->
    <QuoteAddedToast v-if="b.toast.value" :text="b.toast.value" />

    <QuotePickerSheet
      v-if="b.pickerOpen.value"
      :room-name="b.activeRoom.value?.name ?? 'the quote'"
      :added-count="b.addedCount.value"
      :results="results"
      :query="query"
      @update:query="query = $event"
      @add="b.add"
      @close="b.pickerOpen.value = false"
    />

    <QuoteMoneySheet
      v-if="b.moneyOpen.value && b.money.value"
      :money="b.money.value"
      :charges="b.charges.value"
      :itemised="b.itemised.value"
      :editable="b.editable.value"
      @charge="b.setCharge"
      @update:itemised="b.itemised.value = $event"
      @close="b.moneyOpen.value = false"
    />

    <QuoteAnswerSheet
      v-if="b.answerOpen.value && b.money.value"
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
.phone {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

/*
 * While block B is open the header rides above the scrim rather than under it.
 *
 * B1 draws the scrim starting below the header, and the reason is the only way
 * off this screen: the sheet opens by itself on every sent quote and its scrim
 * is inert, so `‹ Quotes` is "Not yet". A scrim over it would be a sheet with
 * no door.
 */
.phone--answering :deep(.head) {
  position: relative;
  z-index: 41;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 12px;
  flex: none;
}

.seg {
  flex: 1;
  min-width: 0;
}

.seg :deep(.s-seg) {
  display: flex;
  width: 100%;
}

.edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 12px 0;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  flex: none;
}

/* The strip above already carries the rule that closes the scroll, so the money
   bar does not draw a second one against it. */
.edit + :deep(.bar) {
  border-top: none;
}

/* The one scroll on this screen. It starts under the band, so `.adding` can
   stick to its top without having to know how tall the band is. */
.page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  /* It scrolls without drawing a bar, as the room rail above it does. */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page::-webkit-scrollbar {
  display: none;
}

/* Grows to fill a short quote so the money still sits at the foot of the
   screen, never shrinks a long one — that is `0` for flex-shrink, and it is
   what keeps the rows at their own height instead of squeezing them to fit. */
.list {
  flex: 1 0 auto;
  border-top: 1px solid var(--color-line);
}

.adding {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
  position: sticky;
  top: 0;
  z-index: 1;
}

.adding-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.empty {
  padding: 32px 16px;
  text-align: center;
}

.other-label {
  display: block;
  padding: 16px 16px 6px;
}

.other {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  min-height: var(--hit-min);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-divider);
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.other:active {
  background: var(--color-surface);
}

.other:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.other-name,
.other-meta,
.other-total {
  color: var(--color-fg-2);
}
</style>
