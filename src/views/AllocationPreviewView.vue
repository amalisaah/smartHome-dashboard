<script setup lang="ts">
import { catalogueKeys, useCatalogueGroups, useCatalogueItems } from '@/api/hooks/catalogue'
import { shipmentKeys, useShipmentPreview } from '@/api/hooks/shipments'
import { receiveShipment, updateItem, updateShipment, updateShipmentLine } from '@/api/shipments'
import { SBanner } from '@/components/atoms'
import AllocationActionBar from '@/components/shipment/AllocationActionBar.vue'
import AllocationOverridePanel from '@/components/shipment/AllocationOverridePanel.vue'
import AllocationPreviewHeader from '@/components/shipment/AllocationPreviewHeader.vue'
import AllocationPreviewTable from '@/components/shipment/AllocationPreviewTable.vue'
import AllocationReadout from '@/components/shipment/AllocationReadout.vue'
import ReceiveDialog from '@/components/shipment/ReceiveDialog.vue'
import {
  MOVED_ENOUGH_THRESHOLD_PERCENT,
  PREVIEW_COPY,
} from '@/data/shipmentCopy'
import type { AllocationBasis } from '@/types/shipment'
import { allocationFacts, readoutChips, receiveConsequences } from '@/utils/allocationFacts'
import { basisToApi, toPreviewRow, toShipmentMeta } from '@/utils/mapper/shipmentMapper'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ shipmentId: number }>()

const router = useRouter()
const queryClient = useQueryClient()

const previewQuery = useShipmentPreview(() => props.shipmentId)
const itemsQuery = useCatalogueItems()
const groupsQuery = useCatalogueGroups()

const groups = computed(() => groupsQuery.data.value ?? [])
const items = computed(() => itemsQuery.data.value ?? [])

const shipment = computed(() => {
  const detail = previewQuery.data.value
  return detail
    ? toShipmentMeta(detail)
    : {
        id: props.shipmentId,
        ref: '',
        state: 'draft' as const,
        receivedAt: null,
        basis: 'by-value' as AllocationBasis,
      }
})
const readOnly = computed(() => shipment.value.state === 'received')

/** Both totals are the shipment's own, summed by the API. */
const sharedTotal = computed(() => previewQuery.data.value?.shared_cost_total_pesewas ?? 0)
const productTotal = computed(() => previewQuery.data.value?.product_value_total_pesewas ?? 0)

/**
 * The table. Every allocated figure is the API's; what it costs to sell comes
 * from the item's group, which is why a row without one has no price to show.
 *
 * The split he is typing is laid over it here, and only here: the draft holds
 * the rows he has spoken for, so this is the one place that knows a row carries
 * his figure if he has given one and the server's if he has not. Everything
 * downstream reads `manualPesewas` without knowing there was a choice.
 */
const rows = computed(() =>
  (previewQuery.data.value?.lines ?? []).map((line) => {
    const item = items.value.find((candidate) => candidate.id === line.item_id)
    const group = groups.value.find((candidate) => candidate.id === item?.group?.id)
    const row = toPreviewRow(line, item, group, sharedTotal.value)
    const typed = allocation.value.sharedValue?.find((entry) => entry.rowId === line.id)
    return typed ? { ...row, manualPesewas: typed.value } : row
  }),
)

const units = computed(() => rows.value.reduce((sum, row) => sum + row.qty, 0))
const lineCount = computed(() => rows.value.length)

const confirming = ref(false)

/**
 * Everything on this screen that is his and not yet the record's: the basis he
 * chose, and the lines he has typed a figure into. Nothing here goes to the
 * server until he saves, so the table never re-costs itself under his caret.
 */
const allocation = ref<{
  basis: AllocationBasis
  sharedValue?: { rowId: number; value: number }[]
}>({ basis: shipment.value.basis, sharedValue: undefined })

// Until he has touched it, the basis is whatever the shipment says.
watch(() => shipment.value.basis, (saved) => { allocation.value.basis = saved })

function setBasis(next: AllocationBasis) {
  if (next === allocation.value.basis) return
  allocation.value.basis = next
}

const manual = computed(() => allocation.value.basis === 'override')

const assignedPesewas = computed(() =>
  rows.value.reduce((sum, row) => sum + (row.manualPesewas ?? 0), 0),
)

const dirty = computed(
  () => allocation.value.sharedValue !== undefined || allocation.value.basis !== shipment.value.basis,
)

const balanced = computed(() => assignedPesewas.value === sharedTotal.value)

/** A hand-made split has to come to the whole shared cost before it can be sent. */
const saveBlocked = computed(() => manual.value && !balanced.value)

/**
 * TODO: the lines go one PATCH each — there is no batch endpoint yet, so a
 * failure partway leaves some of them saved. Collapses to a single call once
 * the server takes them together.
 */
const draftMutation = useMutation({
  mutationFn: async () => {
    await updateShipment(props.shipmentId, {
      allocation_method: basisToApi(allocation.value.basis),
    })
    if (!manual.value) return
    await Promise.all(
      (allocation.value.sharedValue ?? []).map((entry) =>
        updateShipmentLine(props.shipmentId, entry.rowId, {
          manual_allocation_pesewas: entry.value,
        }),
      ),
    )
  },
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: shipmentKeys.all })
    // Saved is no longer his alone, so the draft goes back to being untouched.
    allocation.value.sharedValue = undefined
    toList()
  },
})

function saveDraft() {
  if (saveBlocked.value) return
  draftMutation.mutate()
}

/** A group he picked is not here: that was written to the item when he picked it. */
function discardChanges() {
  allocation.value.sharedValue = undefined
  allocation.value.basis = shipment.value.basis
}

/** Only a save that left and did not land. A split that does not add up never leaves. */
const saveFailure = computed(() => {
  const error = draftMutation.error.value
  return error instanceof Error ? error.message : null
})

/** One entry per row: retyping a figure replaces what that row already carries. */
const setManual = (rowId: number, pesewas: number) => {
  if (!allocation.value.sharedValue) allocation.value.sharedValue = []
  const existing = allocation.value.sharedValue.find((entry) => entry.rowId === rowId)
  if (existing) existing.value = pesewas
  else allocation.value.sharedValue.push({ rowId, value: pesewas })
}

/**
 * What receiving will do, counted once from the rows and said twice: as chips
 * under the read-out, and as the dialog's list when he goes to commit. Under a
 * hand-made split it also carries what does not add up yet.
 */
const facts = computed(() =>
  allocationFacts(
    rows.value,
    manual.value
      ? { sharedPesewas: sharedTotal.value, assignedPesewas: assignedPesewas.value }
      : undefined,
  ),
)
const chips = computed(() => readoutChips(facts.value))
const consequences = computed(() => receiveConsequences(facts.value, units.value, lineCount.value))

/**
 * Picking the group in the row that blocks is what unblocks it: the group is
 * where the markup comes from, and the markup is the price. It is written to the
 * item, because that is where a group lives — the shipment only points at it.
 */
const assignGroupMutation = useMutation({
  mutationFn: ({ itemId, groupId }: { itemId: number; groupId: number }) =>
    updateItem(itemId, { group_id: groupId }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: catalogueKeys.items() })
    await queryClient.invalidateQueries({ queryKey: shipmentKeys.preview(props.shipmentId) })
  },
})

function assignGroup(rowId: number, slug: string) {
  const group = groups.value.find((candidate) => candidate.slug === slug)
  const row = rows.value.find((candidate) => candidate.id === rowId)
  if (!group || !row) return
  assignGroupMutation.mutate({ itemId: row.itemId, groupId: group.id })
}

const backToLines = () =>
  router.push({ name: 'shipment-builder', params: { id: props.shipmentId } })

const toList = () => router.push({ name: 'shipments' })

/** Escape on the preview is `Back to lines` — the same exit, by keyboard. */
function onKeydown(event: KeyboardEvent) {
  // The dialog above has its own Escape, and it answers first.
  if (event.key !== 'Escape' || confirming.value) return
  if (readOnly.value) toList()
  else backToLines()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

/** The irreversible one. Stock and costs move here, on the server. */
const receiveMutation = useMutation({
  mutationFn: () => receiveShipment(props.shipmentId),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: shipmentKeys.all })
    await queryClient.invalidateQueries({ queryKey: catalogueKeys.all })
    toList()
  },
})

function receive() {
  confirming.value = false
  receiveMutation.mutate()
}

</script>

<template>
  <main class="page">
    <!-- C2 — laptop 1440. A full-width surface that opens over the lines, not a
         centred dialog; the heavier shadow is what says it is a layer above. -->
    <div class="frame">
      <AllocationPreviewHeader
        :shipment-ref="shipment.ref"
        :basis="allocation.basis"
        :shared-pesewas="sharedTotal"
        :product-pesewas="productTotal"
        :read-only="readOnly"
        @update:basis="setBasis"
      />

      <SBanner v-if="saveFailure" variant="error" label="error" title="That didn't save.">
        {{ saveFailure }}
      </SBanner>

      <!-- A received shipment's split is history: figures, not fields. -->
      <AllocationPreviewTable
        :rows="rows"
        :moved-threshold="MOVED_ENOUGH_THRESHOLD_PERCENT"
        :groups="groups"
        :manual="manual && !readOnly"
        :read-only="readOnly"
        @assign-group="assignGroup"
        @set-manual="setManual"
      />

      <div class="band">
        <AllocationReadout :sentence="PREVIEW_COPY.sentence" :chips="chips" />
        <AllocationOverridePanel
          :manual="manual"
          :shared-pesewas="sharedTotal"
          :assigned-pesewas="assignedPesewas"
          :read-only="readOnly"
        />
      </div>

      <AllocationActionBar
        :unit-count="units"
        :dirty="dirty"
        :save-blocked="saveBlocked"
        :saving="draftMutation.isPending.value"
        :read-only="readOnly"
        :received-at="shipment.receivedAt"
        @back="backToLines"
        @draft="saveDraft"
        @discard="discardChanges"
        @receive="confirming = true"
        @close="toList"
      />
    </div>

    <ReceiveDialog
      v-if="confirming"
      :shipment-ref="shipment.ref"
      :consequences="consequences"
      @receive="receive"
      @dismiss="confirming = false"
    />
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 48px;
  background: var(--color-chrome);
}

.frame {
  width: 100%;
  max-width: 1440px;
  min-width: 1100px;
  margin: 0 auto;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  /* Heavier than a resting card: this opened over the lines. */
  box-shadow: var(--shadow-elev-2);
  overflow: visible;
  line-height: normal;
}

.band {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  border-bottom: 1px solid var(--color-line);
}

@media (max-width: 1200px) {
  .page {
    padding: 24px;
  }
}
</style>
