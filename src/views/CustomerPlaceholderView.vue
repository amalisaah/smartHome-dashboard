<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomer } from '@/api/hooks/customers'
import { SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'

/**
 * A navigation stub. Her house is designed elsewhere in module 5 and out of
 * scope here; these routes exist so nothing on the list or on her page is a dead
 * click.
 */
const props = defineProps<{
  customerId: number
  destination: 'detail' | 'house'
}>()

const isPhone = useMediaQuery('(max-width: 899px)')
const router = useRouter()

// Her name, so a stub still says whose page this is. A failure costs the
// heading its name and nothing else.
const customerQuery = useCustomer(() => props.customerId)
const customer = computed(() => customerQuery.data.value ?? null)

const who = computed(() => customer.value?.name ?? 'This customer')

const TITLE: Record<typeof props.destination, (name: string) => string> = {
  house: (name) => `${name} · her house`,
  detail: (name) => name,
}

const DETAIL: Record<typeof props.destination, string> = {
  house:
    'The house — rooms, installed devices and visit notes. It opens on Rooms when her visit notes are already filled in and on Visit notes when they are not, and its header carries ‹ her name as the way to this page.',
  detail: 'Her customer page — the contact log, her quotes and the way into her house.',
}

const title = computed(() => TITLE[props.destination](who.value))

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
        @click="router.push({ name: 'customers' })"
      >
        Back to the list
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
