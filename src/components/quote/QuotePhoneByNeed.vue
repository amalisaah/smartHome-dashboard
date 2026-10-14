<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import { formatMoney } from '@/utils/format'
import { needGroups, type QuoteLine } from '@/types/quote'

/**
 * The same lines, grouped by need instead of by room — a sanity check, not an
 * editor.
 *
 * Nothing here is tappable, on purpose. "Lighting · 9 points" is the question
 * *did I cover the house*, and the answer to it is read, not edited; editing
 * happens where the room is, because that is where he is standing.
 */
const props = defineProps<{ lines: QuoteLine[] }>()

const groups = computed(() => needGroups(props.lines))
</script>

<template>
  <div>
    <section v-for="group in groups" :key="group.need">
      <div class="head">
        <SText type="heading" as="h2">
          {{ group.label }}
          <SText type="list-meta" as="span" color="fg-2">
            · {{ group.points }} {{ group.points === 1 ? 'point' : 'points' }}
          </SText>
        </SText>
        <SText type="count">{{ formatMoney(group.totalPesewas) }}</SText>
      </div>

      <div v-for="line in group.lines" :key="line.id" class="row">
        <span class="left">
          <SText type="list-title" as="span">{{ line.itemName ?? 'Untitled item' }}</SText>
          <SText type="cell-meta" color="fg-2">
            ×{{ line.quantity }} · {{ line.roomName ?? 'whole house' }}
          </SText>
        </span>
        <span class="right">
          <SText type="list-figure">{{ formatMoney(line.totalPesewas) }}</SText>
          <SText type="cell-meta" color="fg-2">cost {{ formatMoney(line.costPesewas) }}</SText>
        </span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  min-height: 48px;
  border-bottom: 1px solid var(--color-divider);
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
  gap: 3px;
  flex: none;
}
</style>
