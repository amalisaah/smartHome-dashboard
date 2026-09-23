<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import { DELTA_COLOR, formatDelta, type Movement } from '@/types/item'

/**
 * Every change to stock, and nothing overwritten. Stock on hand appears only in
 * the dashed card above — this screen never offers a total field, because a
 * count only moves through a movement that carries a reason.
 */
defineProps<{ movements: Movement[] }>()

defineEmits<{ adjust: []; open: [movement: Movement] }>()
</script>

<template>
  <div class="card">
    <div class="head">
      <SText type="pane-title" as="h2">Movements</SText>
      <SText type="hint">every change, nothing overwritten</SText>
    </div>

    <component
      :is="movement.linked ? 'button' : 'div'"
      v-for="(movement, index) in movements"
      :key="movement.id"
      class="row"
      :class="{
        'row--linked': movement.linked,
        'row--last': index === movements.length - 1,
      }"
      :type="movement.linked ? 'button' : undefined"
      @click="movement.linked && $emit('open', movement)"
    >
      <SText type="cell-meta">{{ movement.date }}</SText>
      <SText type="row-meta" color="fg" class="what">{{ movement.description }}</SText>
      <!-- The delta's ink is its kind: received is action, a loss is risk, an
           ordinary outflow is neither. -->
      <SText type="money" :color="DELTA_COLOR[movement.kind]" class="figure">
        {{ formatDelta(movement.delta) }}
      </SText>
      <SText type="money" color="fg-2-soft" class="figure">{{ movement.balance }}</SText>
    </component>

    <div class="foot">
      <SButton variant="secondary" size="sm" @click="$emit('adjust')">Adjust count</SButton>
      <SText type="caption">
        Adjusting asks for a reason and writes a movement — it never edits the total.
      </SText>
    </div>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-line);
}

.row {
  display: grid;
  grid-template-columns: 74px 1fr 56px 56px;
  gap: 10px;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-divider);
  /* The rows are a table, not a form: no box, no radius, full width. */
  background: none;
  border-left: none;
  border-right: none;
  border-top: none;
  text-align: left;
  width: 100%;
  font: inherit;
  color: inherit;
}

/* The last row's divider is the foot's own top border. Flagged by index rather
   than `:last-of-type`, which counts buttons and divs apart and so would match
   twice in a list where only some rows link somewhere. */
.row--last {
  border-bottom: none;
}

/* Only a row that leads somewhere reacts. A write-off is a fact with no screen
   behind it, and a hover on it would promise one. */
.row--linked {
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.row--linked:hover {
  background: var(--color-surface);
}

.row--linked:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.what {
  min-width: 0;
}

.figure {
  text-align: right;
}

.foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
}
</style>
