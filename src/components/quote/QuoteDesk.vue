<script setup lang="ts">
import { computed, ref } from 'vue'
import { SText } from '@/components/atoms'
import AppBar from '@/components/app/AppBar.vue'
import AppTabBar from '@/components/app/AppTabBar.vue'
import QuoteDeskByNeed from './QuoteDeskByNeed.vue'
import QuoteDeskMoneyRail from './QuoteDeskMoneyRail.vue'
import QuoteDeskRail from './QuoteDeskRail.vue'
import QuoteDeskRoomHeader from './QuoteDeskRoomHeader.vue'
import QuoteDeskRow from './QuoteDeskRow.vue'
import QuoteModeBand from './QuoteModeBand.vue'
import QuoteOffRow from './QuoteOffRow.vue'
import type { QuoteBuilder } from '@/composables/useQuoteBuilder'
import type { QuoteHeader } from '@/types/quote'

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
}>()

defineEmits<{ send: [] }>()

const b = props.builder
const query = ref('')

const results = computed(() => (query.value.trim() ? b.search(query.value) : []))

const status = computed(() =>
  props.online
    ? `saved${props.savedAt ? ` · ${props.savedAt}` : ''}`
    : 'no signal · held on this laptop',
)
</script>

<template>
  <div class="desk">
    <QuoteModeBand />
    <AppBar :status="status" :alarmed="!online" />
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
            @update:query="query = $event"
            @add="b.add"
            @toggle-off="b.showOff.value = !b.showOff.value"
          />

          <div class="table">
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
        @charge="b.setCharge"
        @update:itemised="b.itemised.value = $event"
        @her="b.showHer"
        @send="$emit('send')"
      />
    </div>
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

.table {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.thead {
  display: grid;
  grid-template-columns: minmax(200px, 2fr) 120px 120px 96px 80px minmax(0, 1fr) 84px;
  gap: 12px;
  padding: 10px 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
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
  padding: 32px 24px;
}
</style>
