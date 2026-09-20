<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
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

const sharedTotal = computed(() =>
  (previewQuery.data.value?.cost_lines ?? []).reduce((sum, cost) => sum + cost.amount_pesewas, 0),
)

/**
 * The table. Every allocated figure is the API's; what it costs to sell comes
 * from the item's group, which is why a row without one has no price to show.
 */
const rows = computed(() =>
  (previewQuery.data.value?.lines ?? []).map((line) => {
    const item = items.value.find((candidate) => candidate.id === line.item_id)
    const group = groups.value.find((candidate) => candidate.id === item?.group?.id)
    return toPreviewRow(line, item, group, sharedTotal.value)
  }),
)

const productTotal = computed(() => rows.value.reduce((sum, row) => sum + row.productPesewas, 0))
const units = computed(() => rows.value.reduce((sum, row) => sum + row.qty, 0))
const lineCount = computed(() => rows.value.length)

const confirming = ref(false)

/**
 * The basis is the shipment's, not the screen's: it is `allocation_method` on
 * the record, and the preview allocates by it. So the control writes it through
 * and asks for the figures again — the segment moves at once, because he chose
 * it, and the table catches up when the server has re-spread the costs.
 */
const basis = ref<AllocationBasis>(shipment.value.basis)
watch(() => shipment.value.basis, (saved) => { basis.value = saved })

const basisMutation = useMutation({
  mutationFn: (next: AllocationBasis) =>
    updateShipment(props.shipmentId, { allocation_method: basisToApi(next) }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: shipmentKeys.preview(props.shipmentId) })
    await queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(props.shipmentId) })
    await queryClient.invalidateQueries({ queryKey: shipmentKeys.list() })
  },
  // It did not take, so the control goes back to what the shipment still says.
  onError: () => { basis.value = shipment.value.basis },
})

function setBasis(next: AllocationBasis) {
  if (next === basis.value) return
  basis.value = next
  basisMutation.mutate(next)
}

/**
 * The split he decided himself, line by line.
 *
 * `manual_allocation_pesewas` lives on the shipment line, so this is a write to
 * the line and not to the shipment — and the rest of the line has to go with it,
 * because that is the shape `PATCH .../lines/{id}` takes. The amounts are
 * accepted as typed; it is receiving that insists they add up.
 */
const manual = computed(() => basis.value === 'override')

const assignedPesewas = computed(() =>
  rows.value.reduce((sum, row) => sum + (row.manualPesewas ?? 0), 0),
)

const manualMutation = useMutation({
  mutationFn: ({ rowId, pesewas }: { rowId: number; pesewas: number }) => {
    const line = (previewQuery.data.value?.lines ?? []).find((candidate) => candidate.id === rowId)
    if (!line) throw new Error('That line is no longer on this shipment.')
    return updateShipmentLine(props.shipmentId, rowId, {
      item_id: line.item_id,
      quantity: line.quantity,
      unit_price_pesewas: line.unit_price_pesewas,
      manual_allocation_pesewas: pesewas,
    })
  },
  // The landed costs downstream of it are the server's to work out again.
  onSuccess: () =>
    queryClient.invalidateQueries({ queryKey: shipmentKeys.preview(props.shipmentId) }),
})

const setManual = (rowId: number, pesewas: number) => manualMutation.mutate({ rowId, pesewas })

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

const failure = computed(() => {
  const error =
    receiveMutation.error.value ??
    assignGroupMutation.error.value ??
    basisMutation.error.value ??
    manualMutation.error.value
  return error instanceof Error ? error.message : null
})
</script>

<template>
  <main class="page">
    <!-- C2 — laptop 1440. A full-width surface that opens over the lines, not a
         centred dialog; the heavier shadow is what says it is a layer above. -->
    <div class="frame">
      <AllocationPreviewHeader
        :shipment-ref="shipment.ref"
        :basis="basis"
        :shared-pesewas="sharedTotal"
        :product-pesewas="productTotal"
        :read-only="readOnly"
        @update:basis="setBasis"
      />

      <SBanner v-if="failure" variant="error" label="error" title="That didn't go through.">
        {{ failure }}
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
        :read-only="readOnly"
        :received-at="shipment.receivedAt"
        @back="backToLines"
        @draft="toList"
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
