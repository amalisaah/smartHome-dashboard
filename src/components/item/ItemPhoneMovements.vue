<script setup lang="ts">
import { SText } from '@/components/atoms'
import { DELTA_COLOR, formatDelta, type Movement } from '@/types/item'

/**
 * The last few movements, without the date or the balance — at 390px the
 * question is what happened, not when or what it left behind. The head counts
 * the rows underneath it rather than naming a number of its own, so the label
 * can never disagree with what is on screen.
 */
defineProps<{ movements: Movement[] }>()

defineEmits<{ openAll: [] }>()
</script>

<template>
  <div class="block">
    <button type="button" class="head" @click="$emit('openAll')">
      <SText type="pane-title" as="h2">Movements</SText>
      <SText type="hint">last {{ movements.length }}</SText>
    </button>

    <div
      v-for="(movement, index) in movements"
      :key="movement.id"
      class="row"
      :class="{ 'row--last': index === movements.length - 1 }"
    >
      <SText type="row-meta" color="fg" class="what">{{ movement.shortDescription }}</SText>
      <SText type="money" :color="DELTA_COLOR[movement.kind]">
        {{ formatDelta(movement.delta) }}
      </SText>
    </div>
  </div>
</template>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: var(--hit-min);
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-divider);
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.head:hover {
  background: var(--color-surface);
}

.head:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-divider);
}

.row--last {
  border-bottom: none;
}

.what {
  min-width: 0;
}
</style>
