<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import { isLowStock, type CatalogueItem } from '@/types/catalogue'
import { formatLead, formatMoney, splitOnMatch } from '@/utils/format'

const props = defineProps<{
  item: CatalogueItem
  query: string
  /** Set when the row was pulled in by a keyword rather than its name. */
  matchedKeyword?: string | null
}>()

defineEmits<{ open: [] }>()

const lowStock = computed(() => isLowStock(props.item))
/** Out of stock and still stocked — a discontinued line at 0 is finished, not urgent. */
const sourceToOrder = computed(
  () => props.item.stock === 0 && props.item.discontinuedAt === null,
)
const urgent = computed(() => lowStock.value || sourceToOrder.value)

const nameParts = computed(() => splitOnMatch(props.item.name ?? 'Untitled item', props.query))

const metaSegments = computed(() => {
  const { stock, reorderLevel, group, leadDays } = props.item
  const lead = leadDays === null ? null : formatLead(leadDays)

  if (sourceToOrder.value) {
    return ['0 held', 'source to order', lead]
  }
  if (lowStock.value) {
    return [`${stock} left`, `reorder at ${reorderLevel}`, lead]
  }
  return [`${stock} in stock`, group?.name ?? '—', lead]
})

const metaLine = computed(() => metaSegments.value.filter(Boolean).join(' · '))

/** A keyword-only hit is shown so the row explains why it is here. */
const keywordParts = computed(() =>
  props.matchedKeyword ? splitOnMatch(props.matchedKeyword, props.query) : null,
)
</script>

<template>
  <div
    class="row"
    :class="{ 'row--low-stock': lowStock }"
    tabindex="0"
    role="button"
    @click="$emit('open')"
    @keydown.enter.prevent="$emit('open')"
    @keydown.space.prevent="$emit('open')"
  >
    <span class="left">
      <SText type="list-title">
        <template v-for="(part, index) in nameParts" :key="index">
          <mark v-if="part.match" class="match">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </SText>
      <SText type="list-meta" :color="urgent ? 'risk' : undefined">
        {{ metaLine }}<template v-if="keywordParts"
          >&#32;·&#32;<template v-for="(part, index) in keywordParts" :key="index"
            ><mark v-if="part.match" class="match">{{ part.text }}</mark
            ><template v-else>{{ part.text }}</template></template
          ></template
        >
      </SText>
    </span>

    <span class="right">
      <SText v-if="item.sellPricePesewas === null" type="list-figure" color="risk">no markup</SText>
      <SText v-else type="list-figure">{{ formatMoney(item.sellPricePesewas) }}</SText>
      <SText type="cell-meta" color="fg-2">cost {{ formatMoney(item.landedCostPesewas) }}</SText>
    </span>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-divider);
  min-height: 72px;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.row:hover {
  background: var(--color-row-hover);
}

.row:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.row--low-stock {
  background: var(--color-row-risk-tint);
}

.row--low-stock:hover {
  background: var(--color-row-hover-risk);
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
  flex: none;
}

.match {
  background: var(--color-match-highlight);
  color: inherit;
  border-radius: 3px;
}
</style>
