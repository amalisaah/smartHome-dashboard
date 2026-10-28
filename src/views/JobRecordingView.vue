<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useJobDetail } from '@/api/hooks/jobDetail'
import { SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import JobCompleteBar from '@/components/job/JobCompleteBar.vue'
import JobCostsCard from '@/components/job/JobCostsCard.vue'
import JobHeader from '@/components/job/JobHeader.vue'
import JobLinesPane from '@/components/job/JobLinesPane.vue'
import JobMoneyCard from '@/components/job/JobMoneyCard.vue'
import JobProfitCard from '@/components/job/JobProfitCard.vue'
import JobRecordingSkeleton from '@/components/job/JobRecordingSkeleton.vue'
import JobTypeCard from '@/components/job/JobTypeCard.vue'
import { useJobRecording } from '@/composables/useJobRecording'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { toJobRecord } from '@/utils/mapper/jobMapper'

/**
 * Modules 3+4, block C — recording the job.
 *
 * He sits at a desk at about 9pm, after the fit-out. The job was created when
 * she accepted, and most lines went in as quoted, so this screen is for
 * **correcting, not entering**: the Differences view opens first, the lines
 * that matched collapse into one row, and his three minutes go on the four
 * things that were different.
 *
 * Owner-only, so it uses the light theme and carries no audience band — the
 * amber Cost column and the dark profit card say things no customer may see.
 *
 * The whole screen is one read. See `@/api/jobDetail` for why that endpoint
 * exists and what it replaced.
 */
const props = defineProps<{ jobId: number }>()

const router = useRouter()
const isPhone = useMediaQuery('(max-width: 899px)')
const online = useOnline()

const jobQuery = useJobDetail(() => props.jobId)

const job = computed(() => (jobQuery.data.value ? toJobRecord(jobQuery.data.value) : null))

/** `isPending` is "nothing cached yet", so a revalidation never re-skeletons. */
const loading = computed(() => jobQuery.isPending.value)

const {
  view,
  readOnly,
  jobType,
  consequence,
  groups,
  differingCount,
  lineCount,
  asQuotedCount,
  deviceCount,
  fittedValue,
  chargedValue,
  chargedIsEdited,
  wentNegative,
  completing,
  completeFailed,
  editFitted,
  commitFitted,
  editCharged,
  commitCharged,
  pickType,
  complete,
} = useJobRecording(() => props.jobId, job)

/** The + Add line picker reuses A's item picker and is not drawn yet. */
const addLineStub = ref(false)
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <JobRecordingSkeleton v-if="loading" />

    <div v-else-if="job === null" class="missing">
      <SText type="micro">not found</SText>
      <SText type="title" as="h1">No job {{ String(jobId).padStart(4, '0') }}</SText>
      <SText type="body" color="fg-2">
        It may have been cancelled and removed, or the number may be a quote's rather than a
        job's.
      </SText>
      <SButton variant="secondary" :size="isPhone ? 'lg' : 'md'" @click="router.push({ name: 'quotes' })">
        Back to the quotes
      </SButton>
    </div>

    <!-- C1 — laptop 1440. There is no phone layout in the handoff; below the
         degrade point the grid becomes one column in the order the open
         decision names: header, money, lines, costs, complete. -->
    <div v-else class="body">
      <div class="col col--main">
        <JobHeader :job="job" />

        <JobTypeCard
          :model-value="jobType"
          :consequence="consequence"
          :read-only="readOnly"
          @update:model-value="pickType"
        />

        <JobLinesPane
          :groups="groups"
          :view="view"
          :differing-count="differingCount"
          :line-count="lineCount"
          :as-quoted-count="asQuotedCount"
          :fitted-value="fittedValue"
          :read-only="readOnly"
          @update:view="view = $event"
          @update:fitted="editFitted"
          @commit="commitFitted"
          @add-line="addLineStub = true"
        />
        <SText v-if="addLineStub" type="hint">
          the line picker is A's item picker and is not drawn here yet
        </SText>

        <!-- Gone once the job is settled. There is no reopen (gap D1): a line
             recorded wrong means cancelling and re-recording. -->
        <JobCompleteBar
          v-if="!readOnly"
          :device-count="deviceCount"
          :job-type="jobType"
          :busy="completing"
          :failed="completeFailed"
          :offline="!online"
          :went-negative="wentNegative"
          @complete="complete"
        />
      </div>

      <div class="col col--rail">
        <JobProfitCard :money="job.money" />

        <JobMoneyCard
          :money="job.money"
          :payments="job.payments"
          :charged="chargedValue"
          :charged-is-edited="chargedIsEdited"
          :quote-agreed-pesewas="job.quoteAgreedPesewas"
          :read-only="readOnly"
          @update:charged="editCharged"
          @commit="commitCharged"
        />

        <JobCostsCard
          :costs="job.costs"
          :actual-pesewas="job.money.miscActualPesewas"
          :estimate-pesewas="job.money.miscEstimatePesewas"
          :delta-pesewas="job.money.miscDeltaPesewas"
        />
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 32px;
  padding: 24px 32px 32px;
}

.col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.col--main {
  gap: 24px;
}

.col--rail {
  gap: 16px;
}

.missing {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 32px 20px;
  max-width: 620px;
}

/*
 * No phone layout was drawn for this screen. Below the degrade point it becomes
 * one column in the order open decision 4 names — the money above the lines,
 * because on a phone he is checking a balance rather than correcting eleven
 * rows. The lines table keeps its columns and scrolls sideways rather than
 * reflowing into a layout nobody designed.
 */
@media (max-width: 1100px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    padding: 20px;
  }

  .col--rail {
    order: -1;
  }
}
</style>
