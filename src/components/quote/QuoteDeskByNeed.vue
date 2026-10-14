<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import { formatMoney } from '@/utils/format'
import { needGroups, type QuoteLine } from '@/types/quote'

/**
 * The same lines grouped by need — a sanity check, not an editor, and it says so
 * at the top rather than leaving him to discover that nothing here responds.
 */
const props = defineProps<{ lines: QuoteLine[] }>()

const groups = computed(() => needGroups(props.lines))
</script>

<template>
  <div class="by-need">
    <SText type="cell" color="fg-2">
      The same lines grouped by need: a sanity check, not an editor. Pick a room on the left to
      edit.
    </SText>

    <section v-for="group in groups" :key="group.need" class="card">
      <div class="card-head">
        <SText type="pane-title" as="h2">
          {{ group.label }}
          <SText type="list-meta" as="span" color="fg-2">
            · {{ group.points }} {{ group.points === 1 ? 'point' : 'points' }}
          </SText>
        </SText>
        <SText type="count">{{ formatMoney(group.totalPesewas) }}</SText>
      </div>

      <div v-for="line in group.lines" :key="line.id" class="card-row">
        <SText type="cell">{{ line.itemName ?? 'Untitled item' }}</SText>
        <SText type="list-meta" color="fg-2">
          ×{{ line.quantity }} · {{ line.roomName ?? 'whole house' }}
        </SText>
        <SText type="cell" class="figure">{{ formatMoney(line.totalPesewas) }}</SText>
        <SText type="list-meta" color="fg-2" class="figure">
          {{ formatMoney(line.costPesewas) }}
        </SText>
      </div>
    </section>
  </div>
</template>

<style scoped>
.by-need {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.card-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px 100px 100px;
  gap: 12px;
  padding: 9px 16px;
  border-bottom: 1px solid var(--color-divider);
}

.card-row:last-child {
  border-bottom: none;
}

.figure {
  text-align: right;
}
</style>
