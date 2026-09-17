<script setup lang="ts">
import { computed } from 'vue'
import { SBadge, SText } from '@/components/atoms'
import { isLowStock, marginPercent, type CatalogueItem } from '@/types/catalogue'
import { formatLead, formatMargin, formatMoney, splitOnMatch } from '@/utils/format'

const props = defineProps<{
  item: CatalogueItem
  query: string
}>()

defineEmits<{ open: [] }>()

const lowStock = computed(() => isLowStock(props.item))
const margin = computed(() => marginPercent(props.item))
const nameParts = computed(() => splitOnMatch(props.item.name ?? 'Untitled item', props.query))
/** A lead time of 21 days or more is itself a warning. */
const longLead = computed(() => props.item.leadDays !== null && props.item.leadDays >= 21)

/** Says what is missing, in words, where the value should be. */
const incompleteFlag = computed(() => {
  const missing: string[] = []
  if (!props.item.name) missing.push('no name')
  if (!props.item.group) missing.push('no group')
  return missing.length > 0 ? missing.join(' · ') : null
})

/** A dropped line is not missing a supplier — nothing is being reordered for it. */
const missingSupplier = computed(
  () => !props.item.hasSupplierLink && props.item.discontinuedAt === null,
)
</script>

<template>
  <div
    class="row"
    :class="{ 'row--low-stock': lowStock }"
    role="row"
    tabindex="0"
    @click="$emit('open')"
    @keydown.enter.prevent="$emit('open')"
    @keydown.space.prevent="$emit('open')"
  >
    <span class="cell cell--name" role="cell">
      <SText type="ui">
        <template v-for="(part, index) in nameParts" :key="index">
          <mark v-if="part.match" class="match">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </SText>
      <SBadge v-if="lowStock" variant="low-stock" size="row">reorder</SBadge>
      <SBadge v-if="incompleteFlag" variant="incomplete" size="row">{{ incompleteFlag }}</SBadge>
      <SBadge v-if="missingSupplier" variant="incomplete" size="row">no supplier link</SBadge>
      <SBadge v-if="item.priceOverridden" variant="overridden" size="row">price overridden</SBadge>
    </span>

    <SText v-if="item.group" type="cell-meta" role="cell">{{ item.group.name }}</SText>
    <SText v-else type="cell-meta" color="risk" role="cell">—</SText>

    <span class="cell cell--num" role="cell">
      <SText v-if="lowStock" type="money" class="stock-low"
        >{{ item.stock }}<SText type="money" color="micro" class="stock-denominator"
          >&#32;/ {{ item.reorderLevel }}</SText
        ></SText
      >
      <SText v-else type="money" :color="item.stock === 0 ? 'fg-2-soft' : undefined">
        {{ item.stock }}
      </SText>
    </span>

    <SText type="money" color="fg-2" class="cell--num" role="cell">
      {{ formatMoney(item.landedCostPesewas) }}
    </SText>

    <SText
      type="money"
      :color="item.sellPricePesewas === null ? 'risk' : undefined"
      class="cell--num"
      role="cell"
    >
      {{ item.sellPricePesewas === null ? 'no markup' : formatMoney(item.sellPricePesewas) }}
    </SText>

    <SText
      type="money"
      :color="margin === null ? 'fg-2-soft' : 'fg-2'"
      class="cell--num"
      role="cell"
    >
      {{ margin === null ? '—' : formatMargin(margin) }}
    </SText>

    <SText
      type="cell-meta"
      :color="longLead ? 'risk' : undefined"
      class="cell--num"
      role="cell"
    >
      {{ item.leadDays === null ? '—' : formatLead(item.leadDays) }}
    </SText>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 2.6fr 1fr 0.9fr 1fr 1fr 0.9fr 0.7fr;
  gap: 14px;
  padding: 13px 20px;
  border-bottom: 1px solid var(--color-divider);
  align-items: center;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.row:last-child {
  border-bottom: none;
}

.row:hover {
  background: var(--color-row-hover);
}

.row:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

/* Stock urgency is the only state that tints a row. */
.row--low-stock {
  background: var(--color-row-risk-tint);
}

.row--low-stock:hover {
  background: var(--color-row-hover-risk);
}

.cell--name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cell--num {
  text-align: right;
}

.match {
  background: var(--color-match-highlight);
  color: inherit;
  border-radius: 3px;
}

.stock-low {
  font-weight: 600;
  color: var(--color-risk);
}

.stock-denominator {
  font-weight: 400;
}
</style>
