<script setup lang="ts">
import { computed } from 'vue'
import { SButton, SText } from '@/components/atoms'
import { JOB_TYPES } from '@/types/job'
import type { ApiJobType, ApiNegativeStock } from '@/types/jobApi'

const props = defineProps<{
  deviceCount: number
  jobType: ApiJobType
  /** Completing is in flight. */
  busy: boolean
  /** The last attempt did not land. The job is still open. */
  failed: boolean
  /** No connection: completing is the one act that may not be attempted. */
  offline: boolean
  /** Named by the completion, after the fact. */
  wentNegative: ApiNegativeStock[]
}>()

defineEmits<{ complete: [] }>()

const typeName = computed(
  () => JOB_TYPES.find((type) => type.value === props.jobType)?.name.toLowerCase() ?? props.jobType,
)
</script>

<template>
  <div class="bar">
    <div class="says">
      <SText type="meta" color="fg-2" class="sentence">
        Completing draws {{ deviceCount }} devices from stock and writes them to her house record
        as {{ typeName }}. After this the job is settled. Late receipts can still be added as
        costs.
      </SText>

      <!-- It never blocked the write, and it is not an error. He installed
           something whose shipment is not logged yet; the catalogue will show
           it low until the shipment lands. -->
      <SText v-if="wentNegative.length > 0" type="cell-meta" color="risk">
        Stock went under on
        {{ wentNegative.map((item) => item.item_name ?? `item #${item.item_id}`).join(', ') }} —
        log the shipment and it corrects itself.
      </SText>

      <SText v-else-if="failed" type="cell-meta" color="risk">
        That did not land. The job is still open — press again.
      </SText>

      <SText v-else-if="offline" type="cell-meta" color="risk">
        No connection. Everything you have typed is saved; completing needs the network.
      </SText>
    </div>

    <SButton
      size="lg"
      class="commit"
      :disabled="offline"
      :loading="busy"
      @click="$emit('complete')"
    >
      Complete job
    </SButton>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.says {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 640px;
}

/* 1.6 leading: this is the one paragraph on the screen, and it is read rather
   than scanned. */
.sentence {
  line-height: 1.6;
}

.commit {
  flex-shrink: 0;
}
</style>
