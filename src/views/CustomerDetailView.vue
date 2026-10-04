<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { addContactLog, updateCustomer } from '@/api/customers'
import {
  customerKeys,
  useContactLogs,
  useCustomer,
  useCustomerHouses,
  useDormancyRule,
} from '@/api/hooks/customers'
import { SBanner, STextarea } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import CustomerAnonymiseDialog from '@/components/customers/CustomerAnonymiseDialog.vue'
import CustomerContactDialog from '@/components/customers/CustomerContactDialog.vue'
import CustomerContactHistory from '@/components/customers/CustomerContactHistory.vue'
import CustomerDeleteDialog from '@/components/customers/CustomerDeleteDialog.vue'
import CustomerDetailIdentity from '@/components/customers/CustomerDetailIdentity.vue'
import CustomerDetailSkeleton from '@/components/customers/CustomerDetailSkeleton.vue'
import CustomerEditDialog from '@/components/customers/CustomerEditDialog.vue'
import CustomerHouseList from '@/components/customers/CustomerHouseList.vue'
import CustomerRemovalBand from '@/components/customers/CustomerRemovalBand.vue'
import { removalFiguresMock } from '@/data/customerRemovalMock'
import { HEADING_ID, type ContactHistoryEntry } from '@/types/customerDetail'
import {
  blankContactLogDraft,
  editDraftFrom,
  type CustomerEditDraft,
  type LoggedContact,
} from '@/types/customers'
import { useSaveReporter } from '@/composables/useSaveState'
import { formatShortDate } from '@/utils/format'
import { lastContactPhrase, toCustomerRow } from '@/utils/mapper/customerMapper'

/**
 * Module 5, block F — the customer detail screen.
 *
 * Mostly a reading screen: who she is, what was said and when, what is in her
 * house as counts, and at the bottom two exits that must never be confused with
 * each other. The only thing he writes on the page itself is a contact; her
 * details, her notes among them, are corrected in the edit dialog.
 *
 * Everything on it is read from the API except what the two exits say they
 * would cost, which no endpoint can answer yet — see `removalFiguresMock`.
 */
const props = defineProps<{ customerId: number }>()

const router = useRouter()
const queryClient = useQueryClient()

// Four calls, four fates. Losing the rule costs the stage phrase its date;
// losing the history costs the history; losing the houses costs the houses. None
// of them holds up the rest of the screen, and in particular none of them holds
// up the two exits.
const customerQuery = useCustomer(() => props.customerId)
const historyQuery = useContactLogs(() => props.customerId)
const housesQuery = useCustomerHouses(() => props.customerId)
const dormancyQuery = useDormancyRule()

const record = computed(() => customerQuery.data.value ?? null)
const rule = computed(() => dormancyQuery.data.value ?? null)

/** `isPending` is "nothing cached yet", so a revalidation never re-skeletons. */
const loading = computed(() => customerQuery.isPending.value || record.value === null)

/** The app bar is where save state is said; these two writes are what says it. */
const save = useSaveReporter()

// --- what she has been put through ----------------------------------------

/**
 * Anonymised in this session. The record's own `anonymisedAt` is the truth for
 * one that arrived that way; this is the screen catching up with an act taken in
 * front of him, since nothing is written.
 */
const anonymisedHere = ref(false)

const anonymised = computed(
  () => anonymisedHere.value || record.value?.anonymisedAt != null,
)

/**
 * What stands where her name was. A record that arrived anonymised already
 * carries its placeholder as `name`; one anonymised in front of him takes the
 * supplied label, which only the act can mint.
 */
const anonymousLabel = computed(() =>
  record.value?.anonymisedAt != null
    ? record.value.name
    : removalFiguresMock.anonymousLabel,
)

/** Hers if she arrived anonymised; otherwise today, because it just happened. */
const anonymisedOn = computed(() =>
  formatShortDate(record.value?.anonymisedAt ?? new Date().toISOString()),
)

// --- notes -----------------------------------------------------------------

/**
 * What is remembered about her, shown as it is stored. The page is for reading;
 * her notes are corrected in the edit dialog with the rest of her details, so
 * this field is read-only and the Edit button is the one door to it.
 */
const notes = computed(() => record.value?.notes ?? '')

// --- "Spoke today" ---------------------------------------------------------

/**
 * The same module as the list: the dialog collects what he reached her by and
 * what she said, and nothing is written until he submits it. That is also why
 * there is no Undo here — the entry exists by the time the screen changes, and
 * the API has no way to take one back.
 */
const contactOpen = ref(false)
const contactDraft = reactive(blankContactLogDraft())
const contactSaving = ref(false)
const contactError = ref('')

/** `14:02` — the stamp beside the ✓, as on the list. */
const CLOCK = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** The contact logged in this visit. */
const logged = ref<LoggedContact | null>(null)

/**
 * A status change the data layer reported when the contact was written.
 *
 * It lives here rather than in the history query because the contact log cannot
 * answer it: nothing on the wire records that `quoted → customer` happened, so
 * the only status change this screen can show is one it watched happen. Dashed,
 * because the system decided it.
 */
const statusChange = ref<ContactHistoryEntry | null>(null)

/** The record as the contact dialog and `addContactLog` read one. */
const row = computed(() => (record.value ? toCustomerRow(record.value, rule.value) : null))

const history = computed(() => {
  const entries = historyQuery.data.value ?? []
  return statusChange.value ? [statusChange.value, ...entries] : entries
})

function openContact() {
  contactDraft.kind = 'call'
  contactDraft.note = ''
  contactError.value = ''
  contactOpen.value = true
}

function dismissContact() {
  if (contactSaving.value) return
  contactOpen.value = false
}

async function submitContact() {
  const current = row.value
  if (!current || contactSaving.value) return

  contactSaving.value = true
  contactError.value = ''
  try {
    // Her status before the log goes with it: only this side knows what she was,
    // and the answer says what she is now.
    const result = await addContactLog(current.id, contactDraft, current.status, rule.value)

    // If the data layer moved her, that is an event in its own right and it is
    // drawn dashed, because the system decided it. The UI does not — and the
    // contact log has nowhere to record it, so this is the only place it exists.
    statusChange.value = result
      ? {
          id: 'logged-status',
          date: 'today',
          kind: 'status-change',
          from: current.status,
          to: result.status,
          caption: result.statusCaption,
        }
      : null

    logged.value = { time: CLOCK.format(new Date()), kind: contactDraft.kind, result }
    contactOpen.value = false

    // The entry is written; these read it back rather than echoing it. The
    // history gains the new top row, and the record's `last_contact_at` — and so
    // the phrase beside her number — catches up with it.
    historyQuery.refetch()
    customerQuery.refetch()
  } catch (error) {
    // Held open with what he typed: nothing was recorded, so he can try again.
    contactError.value =
      error instanceof Error ? error.message : 'Could not log the contact.'
  } finally {
    contactSaving.value = false
  }
}

// --- her name and her number ------------------------------------------------

/**
 * The edit form. It holds a copy rather than the record, so Cancel really is one
 * — nothing he types reaches the cache, and the page behind the dialog goes on
 * showing what is actually stored until the save comes back.
 */
const editOpen = ref(false)
const editDraft = reactive<CustomerEditDraft>({ name: '', phone: '', email: '', notes: '' })
const editSaving = ref(false)
const editError = ref('')

/** The button it was opened from, so Escape and Cancel give focus back to it. */
let editOpener: HTMLElement | null = null

function openEdit(event: MouseEvent) {
  const current = record.value
  if (!current) return
  Object.assign(editDraft, editDraftFrom(current))
  editError.value = ''
  editOpener = event.currentTarget as HTMLElement | null
  editOpen.value = true
}

function dismissEdit() {
  if (editSaving.value) return
  editOpen.value = false
  nextTick(() => editOpener?.focus())
}

async function submitEdit() {
  const current = record.value
  if (!current || editSaving.value) return

  editSaving.value = true
  editError.value = ''
  save.saving()
  try {
    await updateCustomer(current.id, editDraft)
    editOpen.value = false
    save.saved()
    nextTick(() => editOpener?.focus())

    // Her page reads the new name; the list she came from must not still be
    // holding the old one behind the breadcrumb.
    customerQuery.refetch()
    queryClient.invalidateQueries({ queryKey: customerKeys.list() })
  } catch (error) {
    // Held open with what he typed: nothing was changed, so he can try again.
    editError.value =
      error instanceof Error ? error.message : 'Could not save the change.'
    save.failed()
  } finally {
    editSaving.value = false
  }
}

// --- the two exits ---------------------------------------------------------

type RemovalDialog = 'anonymise' | 'delete' | null

const removalDialog = ref<RemovalDialog>(null)

/**
 * What focus goes back to when a dialog closes — the button that opened it. The
 * door hands itself over rather than being read off `document.activeElement`,
 * which is only the button if the browser happened to focus it on the press.
 */
let opener: HTMLElement | null = null

function openRemoval(which: Exclude<RemovalDialog, null>, door: HTMLElement) {
  opener = door
  removalDialog.value = which
}

function closeRemoval() {
  removalDialog.value = null
  // After the dialog has gone, or focus lands on something being unmounted.
  nextTick(() => opener?.focus())
}

/**
 * Swapping one exit for the other. The opener is left as it was: he arrived from
 * the delete card, and that is still where closing returns him to.
 */
function swapToAnonymise() {
  removalDialog.value = 'anonymise'
}

/**
 * TODO(api): neither exit writes. Both endpoints exist and both are
 * irreversible, so neither was wired on a handoff that is UI and UX only:
 *
 *   anonymise → `POST /customers/{id}/anonymise`, which answers with the
 *               placeholder name and the `anonymised_at` the chip carries.
 *   delete    → `DELETE /customers/{id}/hard?confirm=true`.
 *
 * Everything either act looks like is already here: anonymise takes her name,
 * phone, WhatsApp, notes, the edit door and both exits off the screen in place;
 * delete returns to the list with the one transient line it is allowed.
 */
function runRemoval(act: 'anonymise' | 'delete') {
  removalDialog.value = null

  if (act === 'anonymise') {
    anonymisedHere.value = true
    // The button he pressed is being unmounted with the band, so focus goes to
    // the heading — which is the thing that has just changed.
    nextTick(() => document.getElementById(HEADING_ID)?.focus())
    return
  }

  router.push({ name: 'customers', query: { deleted: record.value?.name ?? '' } })
}

// --- where the screen leads -------------------------------------------------

/** One named house of hers. Out of scope here; the route is a stub. */
const openHouse = (houseId: number) =>
  router.push({ name: 'house-detail', params: { id: props.customerId, houseId } })

/**
 * Her first house or her fourth — the same form either way, and it has no id to
 * be addressed by until saving it mints one.
 */
const newHouse = () => router.push({ name: 'house-new', params: { id: props.customerId } })
</script>

<template>
  <AppLayout>
    <SBanner v-if="customerQuery.isError.value" variant="error" class="failure">
      Could not load this customer.
    </SBanner>

    <template v-else>
      <div class="body">
        <!-- The frame, the skeleton and the band go up together: the two exits
             are the part of this screen that must never arrive late. -->
        <CustomerDetailSkeleton v-if="loading" class="slot-skeleton" />

        <template v-else-if="record">
          <CustomerDetailIdentity
            class="slot-identity"
            :name="record.name"
            :phone="record.phone ?? ''"
            :status="record.status"
            :last-contact-phrase="lastContactPhrase(record)"
            :logged="logged"
            :anonymised="anonymised"
            :anonymous-label="anonymousLabel"
            :anonymised-on="anonymisedOn"
            @spoke="openContact"
            @edit="openEdit"
          />

          <CustomerContactHistory
            class="slot-history"
            :entries="history"
            :loading="historyQuery.isPending.value"
            :failed="historyQuery.isError.value"
          />

          <!-- Gone with her name: anonymising clears the contact notes. Shown,
               not edited — the Edit button is where they are corrected. -->
          <div v-if="!anonymised" class="slot-notes">
            <STextarea
              :model-value="notes"
              label="Notes about her"
              :rows="3"
              disabled
            />
          </div>
        </template>

        <CustomerHouseList
          v-if="!loading"
          class="slot-house"
          :houses="housesQuery.data.value ?? []"
          :loading="housesQuery.isPending.value"
          :failed="housesQuery.isError.value"
          @open="openHouse"
          @add="newHouse"
        />
      </div>

      <!-- Always visible, both of them, at full contrast. Not once she has been
           anonymised: there is nothing left of her to remove. -->
      <CustomerRemovalBand
        v-if="!anonymised"
        :name="record?.name ?? ''"
        :figures="removalFiguresMock"
        @anonymise="openRemoval('anonymise', $event)"
        @delete="openRemoval('delete', $event)"
      />
    </template>
  </AppLayout>

  <CustomerEditDialog
    v-if="editOpen && record"
    :record="record"
    :draft="editDraft"
    :saving="editSaving"
    :error="editError"
    @save="submitEdit"
    @dismiss="dismissEdit"
  />

  <CustomerContactDialog
    v-if="contactOpen && row"
    :row="row"
    :draft="contactDraft"
    :saving="contactSaving"
    :error="contactError"
    @submit="submitContact"
    @dismiss="dismissContact"
  />

  <CustomerAnonymiseDialog
    v-if="removalDialog === 'anonymise' && record"
    :name="record.name"
    :figures="removalFiguresMock"
    @confirm="runRemoval('anonymise')"
    @dismiss="closeRemoval"
  />

  <CustomerDeleteDialog
    v-if="removalDialog === 'delete' && record"
    :name="record.name"
    :figures="removalFiguresMock"
    @confirm="runRemoval('delete')"
    @swap="swapToAnonymise"
    @dismiss="closeRemoval"
  />
</template>

<style scoped>
/* The left column is a column of three and the right is the house card, but the
   three are laid out by the body grid rather than by a wrapper — so the phone
   fallback can put the house card between the first and the second without
   re-parenting anything. */
.body {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  grid-template-areas:
    'identity house'
    'history  house'
    'notes    house';
  align-content: start;
  gap: 28px 32px;
  padding: 28px 32px;
}

.body > * {
  min-width: 0;
}

.slot-identity {
  grid-area: identity;
}

.slot-history {
  grid-area: history;
}

.slot-notes {
  grid-area: notes;
}

.slot-house {
  grid-area: house;
}

/* While it is loading, the one block stands where the reading does. */
.slot-skeleton {
  grid-area: identity;
}

.failure {
  margin: 20px;
}

/*
 * ⚠️ Not designed. Only the 1440 laptop frame exists in the handoff; this is its
 * stacking fallback — identity, house card, history, notes, and below them the
 * two exits with anonymise first. The drawn boxes do not change; what changes is
 * what can be hit, which each component grows to `--hit-min` at this width.
 */
@media (max-width: 899px) {
  .body {
    grid-template-columns: 1fr;
    grid-template-areas:
      'identity'
      'house'
      'history'
      'notes';
    gap: 24px;
    padding: 20px 16px;
  }
}
</style>
