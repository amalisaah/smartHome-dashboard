<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { addContactLog } from '@/api/customers'
import { useCustomers, useDormancyRule } from '@/api/hooks/customers'
import { SBanner, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import CustomerFooter from '@/components/customers/CustomerFooter.vue'
import CustomerContactDialog from '@/components/customers/CustomerContactDialog.vue'
import CustomerNewDialog from '@/components/customers/CustomerNewDialog.vue'
import CustomerPhoneEmpty from '@/components/customers/CustomerPhoneEmpty.vue'
import CustomerPhoneFilters from '@/components/customers/CustomerPhoneFilters.vue'
import CustomerPhoneFooter from '@/components/customers/CustomerPhoneFooter.vue'
import CustomerPhoneHeader from '@/components/customers/CustomerPhoneHeader.vue'
import CustomerPhoneRow from '@/components/customers/CustomerPhoneRow.vue'
import CustomerPhoneSkeleton from '@/components/customers/CustomerPhoneSkeleton.vue'
import CustomerTable from '@/components/customers/CustomerTable.vue'
import CustomerToolbar from '@/components/customers/CustomerToolbar.vue'
import { useCustomerDraft } from '@/composables/useCustomerDraft'
import { useCustomerList } from '@/composables/useCustomerList'
import { useMediaQuery } from '@/composables/useMediaQuery'
import {
  blankContactLogDraft,
  CUSTOMER_FILTER_COPY,
  customerFilterDefs,
  DEFAULT_FILTER,
  DEFAULT_PHONE_FILTER,
  dormancyExplainer,
  type CustomerRow,
} from '@/types/customers'
import { toCustomerRows } from '@/utils/mapper/customerMapper'

/**
 * Module 5, block D — the customer list.
 *
 * Below ~900px this is D2, whose job is to find a person and open her house;
 * above, D1, whose job is to decide who to call next and record that he did.
 * They are two designs, not one at two widths: the phone has no chasing
 * columns, no quiet-for figures and no per-row action.
 */
const isPhone = useMediaQuery('(max-width: 899px)')

const router = useRouter()

// Two calls, two fates: losing the rule costs the countdown and the amber, so
// the list is never held up waiting for a setting.
const customersQuery = useCustomers()
const dormancyQuery = useDormancyRule()

const rule = computed(() => dormancyQuery.data.value ?? null)

/** The one place a judgement is applied. */
const rows = computed(() => toCustomerRows(customersQuery.data.value ?? [], rule.value))

// Labels go up with the frame; counts are counted off the rows, so a chip
// cannot say 7 and render six.
const filters = computed(() =>
  customersQuery.data.value === undefined
    ? [...CUSTOMER_FILTER_COPY]
    : customerFilterDefs(rows.value),
)

const explainer = computed(() => dormancyExplainer(rule.value))

/** `isPending` is "nothing cached yet", so a revalidation never re-skeletons. */
const loading = computed(() => customersQuery.isPending.value)

const {
  query,
  debouncedQuery,
  searching,
  filter,
  selectFilter,
  sort,
  toggleSort,
  visibleRows,
  phoneRows,
  logged,
  recordContact,
  footerSummary,
  phoneFooter,
  phoneSectionLabel,
} = useCustomerList(rows, filters, {
  initialFilter: isPhone.value ? DEFAULT_PHONE_FILTER : DEFAULT_FILTER,
})

/**
 * The laptop adds an enquiry in a dialog over the list, so the list he was
 * working stays behind it and the filter and scroll position survive. The phone
 * goes to D3's own screen instead — a modal is not a phone's way in.
 */
const dialogOpen = ref(false)
const { draft, duplicate, saving, save, reset } = useCustomerDraft()

function openDialog() {
  reset()
  dialogOpen.value = true
}

async function submit(thenOpenHouse: boolean) {
  if (saving.value) return
  const id = await save()
  dialogOpen.value = false
  if (thenOpenHouse) {
    await router.push({ name: 'customer-house', params: { id } })
    return
  }
  // Saved and staying: the new row arrives on the next fetch, counts with it.
  customersQuery.refetch()
}

function openCustomer(id: number) {
  dialogOpen.value = false
  router.push({ name: 'customer-detail', params: { id } })
}

// Where the rows lead — all out of scope for this handoff.
const openHouse = (row: CustomerRow) =>
  router.push({ name: 'customer-house', params: { id: row.id } })

const newOnPhone = () => router.push({ name: 'customer-new' })

/** The name he could not find is the name he is about to type. */
const addFromQuery = () =>
  router.push({ name: 'customer-new', query: { name: debouncedQuery.value.trim() } })

/**
 * Logging a contact. The dialog holds what he is about to write, and nothing
 * reaches the API until he submits — so closing it is a real way out, which it
 * has to be: an entry cannot be deleted once written.
 */
const contactRow = ref<CustomerRow | null>(null)
const contactDraft = reactive(blankContactLogDraft())
const contactSaving = ref(false)
const contactError = ref('')

function openContact(row: CustomerRow) {
  contactDraft.kind = 'call'
  contactDraft.note = ''
  contactError.value = ''
  contactRow.value = row
}

function dismissContact() {
  if (contactSaving.value) return
  contactRow.value = null
}

async function submitContact() {
  const row = contactRow.value
  if (!row || contactSaving.value) return

  contactSaving.value = true
  contactError.value = ''
  try {
    // The row's current status goes with it: only this side knows what she was
    // before the log, and the answer says what she is after it.
    const result = await addContactLog(row.id, contactDraft, row.status, rule.value)
    recordContact(row, { kind: contactDraft.kind, result })
    contactRow.value = null
  } catch (error) {
    // Held open with what he typed: nothing was recorded, so he can try again.
    contactError.value =
      error instanceof Error ? error.message : 'Could not log the contact.'
  } finally {
    contactSaving.value = false
  }
}
</script>

<template>
  <!-- The phone frame carries its own header, so the app bar and tabs stay off it. -->
  <AppLayout :chrome="!isPhone">
    <!-- D2 — phone 390 -->
    <template v-if="isPhone">
      <CustomerPhoneHeader v-model:query="query" @new-customer="newOnPhone" />
      <CustomerPhoneFilters
        :filters="filters"
        :active="filter"
        :searching="searching"
        @select="selectFilter"
      />

      <SBanner v-if="customersQuery.isError.value" variant="error">
        Could not load the customer list.
      </SBanner>

      <template v-else>
        <SText type="micro" color="micro" class="section-label">{{ phoneSectionLabel }}</SText>

        <CustomerPhoneSkeleton v-if="loading" />
        <CustomerPhoneEmpty
          v-else-if="phoneRows.length === 0 && debouncedQuery.trim()"
          :query="debouncedQuery.trim()"
          @add-query="addFromQuery"
        />
        <div v-else>
          <CustomerPhoneRow
            v-for="row in phoneRows"
            :key="row.id"
            :row="row"
            :query="debouncedQuery"
            @open="openHouse(row)"
          />
        </div>

        <CustomerPhoneFooter :summary="phoneFooter" />
      </template>
    </template>

    <!-- D1 — laptop 1440 -->
    <template v-else>
      <CustomerToolbar
        v-model:query="query"
        :filters="filters"
        :active="filter"
        :searching="searching"
        @select="selectFilter"
        @new-enquiry="openDialog"
      />

      <SBanner v-if="customersQuery.isError.value" variant="error">
        Could not load the customer list.
      </SBanner>

      <template v-else>
        <CustomerTable
          :rows="visibleRows"
          :query="debouncedQuery"
          :loading="loading"
          :sort="sort"
          :logged="logged"
          @sort="toggleSort"
          @open="openCustomer($event.id)"
          @spoke="openContact"
        />

        <CustomerFooter :summary="footerSummary" :explainer="explainer" />
      </template>
    </template>
  </AppLayout>

  <CustomerContactDialog
    v-if="contactRow"
    :row="contactRow"
    :draft="contactDraft"
    :saving="contactSaving"
    :error="contactError"
    @submit="submitContact"
    @dismiss="dismissContact"
  />

  <CustomerNewDialog
    v-if="dialogOpen && !isPhone"
    :draft="draft"
    :duplicate="duplicate"
    :saving="saving"
    @save-and-open-house="submit(true)"
    @save="submit(false)"
    @dismiss="dialogOpen = false"
    @open-duplicate="openCustomer"
  />
</template>

<style scoped>
.section-label {
  padding: 10px 16px 6px;
}
</style>
