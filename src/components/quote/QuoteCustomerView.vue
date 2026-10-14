<script setup lang="ts">
import { SText } from '@/components/atoms'
import QuoteHoldPill from './QuoteHoldPill.vue'
import { formatCurrency, formatMoney } from '@/utils/format'
import type { CustomerQuote } from '@/types/quote'

/**
 * Her view. A **separate screen**, not his screen with the cost hidden.
 *
 * Everything it renders comes from `CustomerQuote`, which is mapped from
 * `GET /quotes/{id}/customer-view` — a document the server builds from a type
 * with no cost field on it. There is no `v-if` in here hiding a figure, and
 * there is no prop that could carry one: if a cost value is never in her view's
 * data, a bug cannot reveal it.
 *
 * The whole thing sits in `.audience-customer`, which remaps the ordinary
 * tokens dark, so the atoms inside render on her ground without knowing they
 * have. Brightness is what tells the two views apart across a room, and there is
 * no partial state — nothing light shows here at all.
 *
 * Its shape differs from his on purpose: one row per need, then Installation,
 * Materials and a total. You can tell the two apart before you can read a word.
 */
defineProps<{ quote: CustomerQuote; phone?: boolean }>()
defineEmits<{ back: [] }>()
</script>

<template>
  <div class="her audience-customer" :class="{ 'her--phone': phone }">
    <div class="scroll">
      <div class="column" :class="{ 'column--phone': phone }">
        <header class="head" :class="{ 'head--phone': phone }">
          <SText type="micro" class="eyebrow">Quote · {{ quote.date }}</SText>
          <SText :type="phone ? 'display' : 'display'" as="h1" class="title">
            For the {{ quote.surname }} home
          </SText>
          <SText type="body" color="fg-2">
            {{ quote.level }}, adjusted to your house · {{ quote.roomCount }} rooms
          </SText>
        </header>

        <div class="groups">
          <div v-for="group in quote.groups" :key="group.label" class="group">
            <div class="group-head">
              <SText :type="phone ? 'frame-title' : 'sheet-title'">{{ group.label }}</SText>
              <SText :type="phone ? 'total' : 'figure'">
                {{ formatMoney(group.totalPesewas) }}
              </SText>
            </div>
            <div v-for="item in group.items" :key="item.text" class="item">
              <SText :type="phone ? 'cell' : 'body'" color="fg-2">{{ item.text }}</SText>
              <SText :type="phone ? 'money' : 'count'" color="fg-2">
                {{ formatMoney(item.totalPesewas) }}
              </SText>
            </div>
          </div>
        </div>

        <div class="total">
          <SText :type="phone ? 'title' : 'display'">Total</SText>
          <SText type="money-lg">{{ formatCurrency(quote.totalPesewas) }}</SText>
        </div>
      </div>
    </div>

    <QuoteHoldPill :phone="phone" @complete="$emit('back')" />
  </div>
</template>

<style scoped>
.her {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-bg);
  color: var(--color-fg);
}

.scroll {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  scrollbar-width: thin;
  scrollbar-color: var(--color-line) transparent;
}

.column {
  width: 760px;
  display: flex;
  flex-direction: column;
  gap: 36px;
  padding: 72px 0 32px;
}

.column--phone {
  width: 100%;
  gap: 28px;
  padding: 48px 24px 24px;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.head--phone {
  gap: 8px;
}

.eyebrow {
  /* .12em rather than micro's .14em: her document, read close, not a chip. */
  letter-spacing: 0.12em;
}

.title {
  line-height: 1.05;
}

.her--phone .title {
  line-height: 1.1;
}

.groups {
  display: flex;
  flex-direction: column;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 0;
  border-bottom: 1px solid var(--color-line);
}

.her--phone .group {
  gap: 6px;
  padding: 16px 0;
}

.group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding-top: 20px;
  /* 2px, and in --fg: the line under everything, not another divider. */
  border-top: 2px solid var(--color-fg);
}

.her--phone .total {
  gap: 12px;
  padding-top: 16px;
}
</style>
