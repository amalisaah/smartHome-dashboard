<script setup lang="ts">
import { computed } from 'vue'
import { SBadge, SInput, SText } from '@/components/atoms'
import type { MarkupRow } from '@/composables/useGroupsMarkup'
import { formatMargin, formatMoney } from '@/utils/format'

const props = defineProps<{ row: MarkupRow }>()

defineEmits<{
  'update:draft': [text: string]
  'update:name': [text: string]
  normalise: []
  'normalise-name': []
}>()

/** The row holds a change of some kind — what tints it. */
const dirty = computed(() => props.row.projection !== null || props.row.rename !== null)

/**
 * What the group's stock is actually earning today, and only that. It does not
 * move while he types: projecting it needs the split between the items the
 * markup reaches and the ones pricing themselves, which the group row does not
 * carry. The consequence of the change is stated in the commit bar instead.
 */
const margin = computed(() => formatMargin(props.row.group.avgMarginPercent))

/** What this group's stock cost to put on the shelf — what the markup rides on. */
const capital = computed(() => formatMoney(props.row.group.capitalInStockPesewas))
</script>

<template>
  <div
    class="row"
    :class="{ 'row--dirty': dirty, 'row--blocked': !!row.nameError }"
    role="row"
    :data-slug="row.group.slug"
  >
    <!-- The name is a field, but it draws no box until he reaches for it: the
         column has to read as the eight names it is, not as eight inputs. -->
    <span class="cell--name" role="cell" @focusout="$emit('normalise-name')">
      <SInput
        class="name"
        variant="flat"
        size="cell"
        data-column="name"
        :aria-label="`Name of the ${row.group.name} group`"
        :error="!!row.nameError"
        :model-value="row.nameDraft"
        @update:model-value="$emit('update:name', $event)"
      />
      <!-- Said in the row that has it, as the thing it stops. -->
      <SBadge v-if="row.nameError" variant="incomplete" size="row">{{ row.nameError }}</SBadge>
    </span>

    <SText type="money" class="num" role="cell">{{ row.group.itemCount }}</SText>

    <!-- A field's intrinsic width would widen the column and pull the row out
         from under the head, so the grid item may be narrower than its content. -->
    <span class="cell--field" role="cell" @focusout="$emit('normalise')">
      <SInput
        class="markup"
        size="split"
        data-column="markup"
        :variant="row.projection ? 'accent' : undefined"
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

/* A row that cannot be saved reads as the warning it is, and keeps reading as
   one on hover — the tint is the state, not the pointer. */
.row--blocked,
.row--blocked:hover {
  background: var(--color-row-risk-tint);
}

.cell--name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* The field takes the column; the flag that follows it keeps its own width. */
.name {
  min-width: 0;
  flex: 1;
}

/* The name still takes weight the moment the row is holding a change, so the
   column reads which rows moved without reading their numbers. */
.row--dirty .name :deep(.s-input) {
  font-weight: 500;
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
