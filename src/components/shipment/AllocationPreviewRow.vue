<script setup lang="ts">
import { computed, ref } from 'vue'
import { SBadge, SCombobox, SText } from '@/components/atoms'
import type { CatalogueGroupRef } from '@/types/catalogue'
import { movePercent, type PreviewRow } from '@/types/shipment'
import { formatMargin, formatMarkup, formatMoney, formatShare } from '@/utils/format'

const props = defineProps<{
  row: PreviewRow
  /**
   * How far a landed cost has to move before the row is marked. What counts as
   * enough is a product decision, not a UI one, so it arrives as a number.
   */
  movedThreshold: number
  groups: CatalogueGroupRef[]
  readOnly?: boolean
}>()

const emit = defineEmits<{ 'assign-group': [slug: string] }>()

const picking = ref(false)

const landedMove = computed(() =>
  movePercent(props.row.landedUnitPesewas, props.row.previousLandedUnitPesewas),
)

/** Restraint is the point: if every row is marked, nothing is. */
const moved = computed(
  () => landedMove.value !== null && Math.abs(landedMove.value) >= props.movedThreshold,
)

const arrow = (move: number | null) => (move === null ? '' : move < 0 ? '↓' : '↑')

/** A was-line always carries its arrow; only a marked row carries the size. */
const landedWasLine = computed(() => {
  if (props.row.previousLandedUnitPesewas === null) return 'first cost'
  const size = moved.value ? ` ${Math.abs(landedMove.value ?? 0)}%` : ''
  return `was ${formatMoney(props.row.previousLandedUnitPesewas)} ${arrow(landedMove.value)}${size}`
})

const sellWasLine = computed(() => {
  if (props.row.previousSellPricePesewas === null) return null
  const move = movePercent(props.row.sellPricePesewas ?? 0, props.row.previousSellPricePesewas)
  return `was ${formatMoney(props.row.previousSellPricePesewas)} ${arrow(move)}`
})

const caption = computed(() =>
  props.row.group === null || props.row.markupBps === null
    ? 'no group yet — no markup to apply'
    : `${props.row.group} · markup ${formatMarkup(props.row.markupBps)}`,
)

const groupOptions = computed(() =>
  props.groups.map((group) => ({ label: group.name, value: group.slug })),
)

function assign(slug: string | number) {
  picking.value = false
  emit('assign-group', String(slug))
}
</script>

<template>
  <div class="row" :class="{ 'row--moved': moved }">
    <span class="cell cell--item">
      <span class="name">
        <SText type="ui">{{ row.itemName }}</SText>
        <SBadge v-if="row.isNew" variant="accepted" size="row">new item</SBadge>
        <SBadge v-if="row.priceOverridden" variant="overridden" size="row">price overridden</SBadge>
      </span>
      <SText type="cell-meta" :color="row.blocksReceiving ? 'risk' : undefined">
        {{ caption }}
      </SText>
    </span>

    <SText type="money" class="num">{{ row.qty }}</SText>
    <SText type="money" color="fg-2" class="num">{{ formatMoney(row.productPesewas) }}</SText>
    <SText type="money" color="fg-2" class="num">{{ formatShare(row.sharePercent) }}</SText>
    <SText type="money" color="fg-2" class="num">{{ formatMoney(row.sharedAddedPesewas) }}</SText>

    <span class="cell cell--stack">
      <SText type="list-figure" :color="moved ? 'risk' : undefined">
        {{ formatMoney(row.landedUnitPesewas) }}
      </SText>
      <SText type="cell-meta" :color="moved ? 'risk' : undefined">{{ landedWasLine }}</SText>
    </span>

    <span class="cell cell--stack">
      <!-- Validation lives in the row that has the problem, and the cell text
           is the control: picking the group here is what unblocks it. -->
      <template v-if="row.blocksReceiving">
        <SCombobox
          v-if="picking"
          class="picker"
          :options="groupOptions"
          placeholder="Group…"
          aria-label="Pick a group"
          @update:model-value="assign"
        />
        <template v-else>
          <button
            type="button"
            class="prompt"
            :disabled="readOnly"
            @click="picking = true"
          >
            <SText type="cell-prompt" color="risk">pick a group</SText>
          </button>
          <SText type="cell-meta">blocks receiving</SText>
        </template>
      </template>

      <template v-else>
        <SText type="list-figure">{{ formatMoney(row.sellPricePesewas ?? 0) }}</SText>
        <SText v-if="sellWasLine" type="cell-meta" :color="moved ? 'risk' : undefined">
          {{ sellWasLine }}
        </SText>
      </template>
    </span>

    <SText
      type="money"
      :color="row.marginPercent === null ? 'fg-2-soft' : 'fg-2'"
      class="num"
    >
      {{ row.marginPercent === null ? '—' : formatMargin(row.marginPercent) }}
    </SText>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 2.2fr 0.6fr 0.9fr 0.9fr 1.1fr 1.25fr 1.25fr 0.8fr;
  gap: 12px;
  padding: 15px 24px;
  border-bottom: 1px solid var(--color-divider);
  align-items: center;
  transition: background-color 120ms ease-out;
}

.row:last-child {
  border-bottom-color: var(--color-line);
}

.row:hover {
  background: var(--color-surface);
}

.row:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

/* Moved enough to matter. The tint marks the row; the figures say by how much. */
.row--moved {
  background: var(--color-row-risk-tint);
}

.row--moved:hover {
  background: var(--color-row-hover-risk);
}

.cell--item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cell--stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  min-width: 0;
}

.num {
  text-align: right;
}

.prompt {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: right;
}

.prompt:disabled {
  cursor: default;
}

.prompt:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}

.picker {
  width: 100%;
}
</style>
