<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import { OVERRIDE_NOTE } from '@/data/shipmentCopy'
import { formatCedi } from '@/utils/format'

const props = defineProps<{
  /** He is deciding the split himself — the panel is then the running total. */
  manual: boolean
  /** What the named costs come to: the figure the lines have to add up to. */
  sharedPesewas: number
  /** What the lines carry between them, as he has set them so far. */
  assignedPesewas: number
  readOnly?: boolean
}>()

/** Positive: still to give out. Negative: he has given out more than there is. */
const differencePesewas = computed(() => props.sharedPesewas - props.assignedPesewas)

const balanced = computed(() => differencePesewas.value === 0)

/**
 * The imbalance in his words, as the consequence rather than as an error code.
 * The server is the one that refuses, but it should never be the first to say so.
 */
const balanceLabel = computed(() =>
  differencePesewas.value > 0 ? 'Left to assign' : 'Over-assigned',
)
</script>

<template>
  <!-- Beside the default, visible, and still not the path. -->
  <div class="panel">
    <SText type="micro" color="micro">Override the split</SText>

    <template v-if="manual">
      <div class="rows">
        <div class="row">
          <SText type="row-meta" color="fg-2-soft" class="label">Shared cost on this shipment</SText>
          <SText type="money" color="fg-2-soft" class="figure">
            {{ formatCedi(sharedPesewas) }}
          </SText>
        </div>
        <div class="row">
          <SText type="row-meta" color="fg" class="label">Assigned across the lines</SText>
          <SText type="money" class="figure">{{ formatCedi(assignedPesewas) }}</SText>
        </div>
        <div class="row row--balance">
          <SText type="row-meta" :color="balanced ? 'fg-2-soft' : 'risk'" class="label">
            {{ balanced ? 'Balanced' : balanceLabel }}
          </SText>
          <SText type="money" :color="balanced ? 'fg-2-soft' : 'risk'" class="figure">
            {{ formatCedi(Math.abs(differencePesewas)) }}
          </SText>
        </div>
      </div>

      <!-- The consequence, in the place that has the problem: the total. -->
      <SText v-if="!balanced && !readOnly" type="cell-meta" color="risk">
        blocks receiving — the lines have to carry the whole shared cost
      </SText>
      <SText v-else type="caption" class="note">
        Type what each line carries in the <b>+ Shared</b> column. A line you leave
        blank carries nothing.
      </SText>
    </template>

    <SText v-else type="caption" class="note">{{ OVERRIDE_NOTE }}</SText>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
  background: var(--color-surface);
  min-width: 0;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* The line the whole panel is about: it is what receiving checks. */
.row--balance {
  padding-top: 8px;
  border-top: 1px solid var(--color-divider);
}

.label {
  flex: 1;
  min-width: 0;
}

.figure {
  width: 112px;
  text-align: right;
  flex: none;
}

.note {
  line-height: 1.6;
}
</style>
