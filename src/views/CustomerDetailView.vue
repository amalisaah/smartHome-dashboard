<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { addContactLog } from '@/api/customers'
import {
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
import CustomerHouseList from '@/components/customers/CustomerHouseList.vue'
import CustomerRemovalBand from '@/components/customers/CustomerRemovalBand.vue'
import { customerDetailMock } from '@/data/customerDetailMock'
import { HEADING_ID, type ContactHistoryEntry } from '@/types/customerDetail'
import { blankContactLogDraft, type LoggedContact } from '@/types/customers'
import { formatShortDate } from '@/utils/format'
import { lastContactPhrase, toCustomerRow } from '@/utils/mapper/customerMapper'

/**
 * Module 5, block F — the customer detail screen.
 *
 * Mostly a reading screen: who she is, what was said and when, what is in her
 * house as counts, and at the bottom two exits that must never be confused with
 * each other. The only things he writes here are a contact and her notes.
 *
 * **What is real and what is not.** Her name, phone, status and notes come from
 * `GET /customers/{id}`, and her contact history from
 * `GET /customers/{id}/contact-logs`. What is left — the house counts and what a
 * removal takes or leaves — is supplied, and until something supplies it comes
 * from `customerDetailMock`, which says per field what it is waiting on.
 *
 * **The two exits do not write.** They run the whole interaction — the gate, the
 * swap, the focus, the state the screen lands in — and stop at `runRemoval`.
 */
const props = defineProps<{ customerId: number }>()

const router = useRouter()

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

/** ⚠️ Mock. See `customerDetailMock` for what each field is waiting on. */
const display = customerDetailMock

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
  record.value?.anonymisedAt != null ? record.value.name : display.figures.anonymousLabel,
)

const anonymisedOn = computed(() =>
  record.value?.anonymisedAt != null
    ? formatShortDate(record.value.anonymisedAt)
    : display.anonymisedOn,
)

// --- notes -----------------------------------------------------------------

/**
 * Free text he edits directly. How and when it saves is not specified by the
 * handoff; the app bar is where save state is said, and it says it for the whole
 * screen rather than for this field.
 */
const notesEdit = ref<string | null>(null)

const notes = computed(() => notesEdit.value ?? record.value?.notes ?? '')

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
 * ⚠️ Neither exit writes. The handoff is UI and UX only — what anonymise and
 * delete do to the data, and which records survive each, are supplied facts it
 * does not state — and both acts are irreversible, so neither is wired on a
 * guess. This is the one seam:
 *
 *   anonymise → `POST /customers/{id}/anonymise`, which answers with the
 *               placeholder name and the `anonymised_at` the chip carries.
 *   delete    → `DELETE /customers/{id}/hard?confirm=true`.
 *
 * The screen does everything either act is supposed to look like: anonymise
 * takes her name, phone, WhatsApp, notes and both exits off the screen in place;
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

const editIdentity = () =>
  router.push({ name: 'customer-edit', params: { id: props.customerId } })
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
            @edit="editIdentity"
          />

          <CustomerContactHistory
            class="slot-history"
            :entries="history"
            :loading="historyQuery.isPending.value"
            :failed="historyQuery.isError.value"
          />

          <!-- Gone with her name: anonymising clears the contact notes. -->
          <STextarea
            v-if="!anonymised"
            class="slot-notes"
            :model-value="notes"
            label="Notes about her"
            :rows="3"
            @update:model-value="notesEdit = $event"
          />
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
        :figures="display.figures"
        @anonymise="openRemoval('anonymise', $event)"
        @delete="openRemoval('delete', $event)"
      />
    </template>
  </AppLayout>

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
    :figures="display.figures"
    @confirm="runRemoval('anonymise')"
    @dismiss="closeRemoval"
  />

  <CustomerDeleteDialog
    v-if="removalDialog === 'delete' && record"
    :name="record.name"
    :figures="display.figures"
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
