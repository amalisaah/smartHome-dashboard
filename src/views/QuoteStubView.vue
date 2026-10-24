<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'

/**
 * The one place a quote still leads that is designed elsewhere: the job an
 * accepted quote became.
 *
 * It exists so that **nothing on this surface is a dead tap**. A button whose
 * destination does not exist yet is worse than one that is greyed out: he
 * presses it, nothing happens, and he has no way to tell a missing screen from
 * a missing record. It says which block it is waiting on and leaves the way
 * back.
 */
const props = withDefaults(
  defineProps<{
    /** The job's number. */
    reference?: number
    destination: 'job'
  }>(),
  { reference: 0 },
)

const isPhone = useMediaQuery('(max-width: 899px)')
const router = useRouter()

const ref4 = computed(() => String(props.reference).padStart(4, '0'))

const TITLE: Record<typeof props.destination, (ref: string) => string> = {
  job: (id) => `Job ${id}`,
}

const DETAIL: Record<typeof props.destination, string> = {
  job: 'Block C — recording the job: what was actually fitted, what it cost and what she has paid. Accepting a quote creates this job and lands here, so a deposit has somewhere to go.',
}

const title = computed(() => TITLE[props.destination](ref4.value))
const detail = computed(() => DETAIL[props.destination])
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <div class="stub">
      <SText type="micro">not in this handoff</SText>
      <SText type="title" as="h1">{{ title }}</SText>
      <SText type="body" color="fg-2">{{ detail }}</SText>
      <SButton
        variant="secondary"
        :size="isPhone ? 'lg' : 'md'"
        @click="router.push({ name: 'quotes' })"
      >
        Back to the quotes
      </SButton>
    </div>
  </AppLayout>
</template>

<style scoped>
.stub {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 32px 20px;
  max-width: 620px;
}
</style>
