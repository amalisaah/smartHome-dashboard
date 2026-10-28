<script setup lang="ts">
import { computed } from 'vue'
import { SBadge, SText } from '@/components/atoms'
import { STATUS_LABEL, type JobRecord } from '@/types/job'

const props = defineProps<{ job: JobRecord }>()

/**
 * The status chip. `in progress` and `scheduled` are both live states, so both
 * take the action outline; `completed` and `cancelled` are settled and go
 * quiet. The chip never carries a fill — a job's state is a fact he reads once,
 * not something shouting across the header.
 */
const settled = computed(
  () => props.job.status === 'completed' || props.job.status === 'cancelled',
)
</script>

<template>
  <header class="header">
    <div class="identity">
      <!-- Back to the jobs list — block E, which is not built, so it is said
           rather than linked. A dead tap would be worse than a plain word. -->
      <SText type="meta" color="fg-2">Jobs ›</SText>

      <SText type="title" as="h1">Job {{ job.number }} — {{ job.household }}</SText>

      <SText v-if="job.quoteNumber" type="meta" color="fg-2">
        From
        <RouterLink v-if="job.quoteId !== null" class="quote-link" :to="{ name: 'quote-detail', params: { id: job.quoteId } }">
          quote {{ job.quoteNumber }}
        </RouterLink>
        <template v-else>quote {{ job.quoteNumber }}</template>
        <template v-if="job.acceptedLine"> · {{ job.acceptedLine }}</template>
      </SText>
      <!-- A callout with no quote behind it. There is no "from" to state, and
           an empty line here would read as a quote that failed to load. -->
      <SText v-else type="meta" color="fg-2">No quote — recorded as a callout</SText>
    </div>

    <SBadge :variant="settled ? 'outcome-declined' : 'outcome-accepted'" size="inline">
      {{ STATUS_LABEL[job.status] }}
    </SBadge>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.identity {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.quote-link {
  color: var(--color-action);
  text-decoration: none;
}

.quote-link:hover {
  text-decoration: underline;
}

.quote-link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}
</style>
