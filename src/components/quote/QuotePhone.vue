<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SSegmented, SText } from '@/components/atoms'
import QuoteAddedToast from './QuoteAddedToast.vue'
import QuoteEditBar from './QuoteEditBar.vue'
import QuoteModeBand from './QuoteModeBand.vue'
import QuoteMoneySheet from './QuoteMoneySheet.vue'
import QuoteOffRow from './QuoteOffRow.vue'
import QuoteOffToggle from './QuoteOffToggle.vue'
import QuotePhoneByNeed from './QuotePhoneByNeed.vue'
import QuotePhoneHeader from './QuotePhoneHeader.vue'
import QuotePhoneLineRow from './QuotePhoneLineRow.vue'
import QuotePhoneMoneyBar from './QuotePhoneMoneyBar.vue'
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
  <div class="phone">
    <QuoteModeBand phone />

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

    <div class="scroll">
      <template v-if="b.groupBy.value === 'room'">
        <!-- Sticky, because the one question a tap on + Add must never raise is
             "which room is this going into". -->
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

    <QuoteAddedToast v-if="b.toast.value" :text="b.toast.value" />

    <div class="edit">
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
    </div>

    <QuotePhoneMoneyBar
      v-if="b.money.value"
      :money="b.money.value"
      :labour-missing="b.labourMissing.value"
      @money="b.moneyOpen.value = true"
      @her="b.showHer"
    />

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

.scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid var(--color-line);
  scrollbar-width: thin;
  scrollbar-color: var(--color-line) transparent;
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
