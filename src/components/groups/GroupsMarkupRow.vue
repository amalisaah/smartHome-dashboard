<script setup lang="ts">
import { computed } from 'vue'
import { SInput, SText } from '@/components/atoms'
import type { MarkupRow } from '@/composables/useGroupsMarkup'
import { formatMargin, formatMoney } from '@/utils/format'

const props = defineProps<{ row: MarkupRow }>()

defineEmits<{ 'update:draft': [text: string]; normalise: [] }>()

const dirty = computed(() => props.row.projection !== null)

/**
 * Old, arrow, new — in the one cell, at the one size, in the one ink. The arrow
 * is the signal that something moved; colour here is reserved for warnings, and
 * a markup change is not one.
 */
const margin = computed(() =>
  props.row.projection
    ? `${formatMargin(props.row.group.avgMarginPercent)} → ${formatMargin(
        props.row.projection.projectedMarginPercent,
      )}`
    : formatMargin(props.row.group.avgMarginPercent),
)

/** What this group's stock cost to put on the shelf — what the markup rides on. */
const capital = computed(() => formatMoney(props.row.group.capitalInStockPesewas))
</script>

<template>
  <div class="row" :class="{ 'row--dirty': dirty }" role="row">
    <!-- The name takes weight the moment the row is holding a change, so the
         column reads which rows moved without reading their numbers. -->
    <SText :type="dirty ? 'ui' : 'cell'" role="cell">{{ row.group.name }}</SText>

    <SText type="money" class="num" role="cell">{{ row.group.itemCount }}</SText>

    <!-- A field's intrinsic width would widen the column and pull the row out
         from under the head, so the grid item may be narrower than its content. -->
    <span
      class="cell--field"
      role="cell"
      :data-slug="row.group.slug"
      @focusout="$emit('normalise')"
    >
      <SInput
        class="markup"
        size="split"
        :variant="dirty ? 'accent' : undefined"
        mono
        align="right"
        :aria-label="`Markup for ${row.group.name}`"
        :model-value="row.draft"
        @update:model-value="$emit('update:draft', $event)"
      />
    </span>

    <SText type="money" color="fg-2" class="num" role="cell">{{ margin }}</SText>

    <SText type="money" color="fg-2" class="num" role="cell">{{ capital }}</SText>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 1fr 1fr 1.4fr;
  gap: 14px;
  padding: 11px 20px;
  align-items: center;
  border-bottom: 1px solid var(--color-divider);
  transition: background-color 120ms ease-out;
}

.row:last-child {
  border-bottom: none;
}

.row:hover {
  background: var(--color-row-hover);
}

/* A row holding a change keeps its tint and darkens; it never falls back to
   the neutral hover. */
.row--dirty {
  background: var(--color-row-action-tint);
}

.row--dirty:hover {
  background: var(--color-row-hover-action);
}

.cell--field {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.markup {
  width: 64px;
}

.num {
  text-align: right;
}
</style>
