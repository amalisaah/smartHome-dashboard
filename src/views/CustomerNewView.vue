<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCustomers } from '@/api/hooks/customers'
import AppLayout from '@/components/app/AppLayout.vue'
import CustomerNewScreen from '@/components/customers/CustomerNewScreen.vue'
import { useCustomerDraft } from '@/composables/useCustomerDraft'
import { useMediaQuery } from '@/composables/useMediaQuery'

/**
 * D3 — `/customers/new`, the phone's full-screen add. The route carries no id
 * because there is nobody to address yet: `POST /customers` mints one on the
 * save, not on the click that opened a blank form.
 *
 * The laptop opens a dialog over the list instead, so this address is reached on
 * a phone or by a direct link. It stays at 390 on a wide screen rather than
 * being stretched into a layout the handoff never drew.
 */
const props = defineProps<{ initialName?: string }>()

const isPhone = useMediaQuery('(max-width: 899px)')
const router = useRouter()

/**
 * Reached by a direct link as well as from the list, so it asks for the list
 * itself — one request, shared with the list's own cache, and the duplicate
 * check then costs nothing per keystroke.
 */
const customersQuery = useCustomers()

const { draft, duplicate, saving, save, checkDuplicate } = useCustomerDraft(
  () => customersQuery.data.value ?? [],
  props.initialName ?? '',
)

const cancel = () => router.push({ name: 'customers' })

async function submit(thenOpenHouse: boolean) {
  if (saving.value) return
  const id = await save()
  await router.push(
    thenOpenHouse ? { name: 'customer-house', params: { id } } : { name: 'customers' },
  )
}
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <div :class="{ 'at-phone-width': !isPhone }">
      <CustomerNewScreen
        :draft="draft"
        :duplicate="duplicate"
        :saving="saving"
        @cancel="cancel"
        @save-and-open-house="submit(true)"
        @save="submit(false)"
        @phone-left="checkDuplicate"
        @open-duplicate="router.push({ name: 'customer-detail', params: { id: $event } })"
      />
    </div>
  </AppLayout>
</template>

<style scoped>
.at-phone-width {
  width: 390px;
  max-width: 100%;
}
</style>
