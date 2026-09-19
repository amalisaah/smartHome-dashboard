<script setup lang="ts">
import { useCatalogueItems } from '@/api/hooks/catalogue'
import { shipmentKeys, useShipment } from '@/api/hooks/shipments'
import ShipmentCostsPane from '@/components/shipment/ShipmentCostsPane.vue'
import ShipmentHeaderBar from '@/components/shipment/ShipmentHeaderBar.vue'
import ShipmentLinesPane from '@/components/shipment/ShipmentLinesPane.vue'
import ShipmentMetaStrip from '@/components/shipment/ShipmentMetaStrip.vue'
import ShipmentNotesStrip from '@/components/shipment/ShipmentNotesStrip.vue'
import { useOnline } from '@/composables/useOnline'
import { useShipmentBuilder } from '@/composables/useShipmentBuilder'
import type { InvoiceLine, SharedCost } from '@/types/shipment'
import { useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

/** Null on `/shipments/new`: the shipment has no id until it is saved. */
const props = defineProps<{ shipmentId: number | null }>()

const router = useRouter()
const queryClient = useQueryClient()
const online = useOnline()

// The view owns the requests; the builder composable owns the draft being typed.
const shipmentQuery = useShipment(() => props.shipmentId)
const itemsQuery = useCatalogueItems()
const items = computed(() => itemsQuery.data.value ?? [])

const {
  meta,
  lines,
  costs,
  pickableItems,
  focusLineId,
  editingCostId,
  isBlankCost,
  unitCount,
  invoiceSubtotal,
  lineTotal,
  productPesewas,
  costCount,
  sharedPesewas,
  shipmentTotalPesewas,
  sharedPercent,
  saveStatus,
  saveState,
  addLine,
  clearLineFocus,
  ensureBlankCost,
  removeCost,
  draftIsEmpty,
  saveDraft,
} = useShipmentBuilder(
  () => props.shipmentId,
  () => shipmentQuery.data.value,
  items,
  () => !itemsQuery.isPending.value,
)

function updateLine(next: InvoiceLine) {
  const index = lines.value.findIndex((line) => line.id === next.id)
  if (index !== -1) lines.value[index] = next
}

function updateCost(next: SharedCost) {
  const index = costs.value.findIndex((cost) => cost.id === next.id)
  if (index === -1) return
  costs.value[index] = next
  // Typing in the blank row makes it a real row and spawns the next blank one.
  ensureBlankCost()
}

/**
 * A shipment with no lines and no costs has nothing the preview could say, so
 * the preview is not offered until one of the two panes holds something.
 */
const nothingToAllocate = computed(() => lines.value.length === 0 && costCount.value === 0)

const close = () => router.push({ name: 'shipments' })

/** Every screen that read this shipment is now looking at a stale copy. */
const refresh = () => queryClient.invalidateQueries({ queryKey: shipmentKeys.all })

/** Filed, then shown where it landed: the list he just put it on. */
async function save() {
  const id = await saveDraft()
  // A failed save keeps him here with everything he typed; the header says why.
  if (id === null) return
  await refresh()
  close()
}

/**
 * The allocation is worked out by the API from what it holds, so the lines have
 * to be there before it can answer. Saving first is not a detour — previewing is
 * one of the moments the shipment becomes real.
 */
async function openPreview() {
  const id = await saveDraft()
  if (id === null) return
  await refresh()
  router.push({ name: 'shipment-preview', params: { id } })
}
</script>

<template>
  <main class="page">
    <!-- C1 — laptop 1440 -->
    <div class="frame">
      <ShipmentHeaderBar
        :shipment-ref="meta.ref"
        :status="saveStatus"
        :offline="!online || saveState === 'failed'"
        :empty="draftIsEmpty"
        :saving="saveState === 'saving'"
        @close="close"
        @save="save"
      />

      <ShipmentMetaStrip :meta="meta" @update:meta="meta = $event" />

      <!-- Two pieces of paper on the desk: the invoice, and what it cost to
           bring it in. Neither goes behind a tab. -->
      <div class="panes">
        <ShipmentLinesPane
          :lines="lines"
          :items="pickableItems"
          :currency="meta.invoiceCurrency"
          :subtotal="invoiceSubtotal"
          :product-pesewas="productPesewas"
          :unit-count="unitCount"
          :line-total="lineTotal"
          :focus-line-id="focusLineId"
          @update:line="updateLine"
          @pick="addLine"
          @focused="clearLineFocus"
        />

        <ShipmentCostsPane
          :costs="costs"
          :editing-cost-id="editingCostId"
          :is-blank-cost="isBlankCost"
          :cost-count="costCount"
          :shared-pesewas="sharedPesewas"
          :total-pesewas="shipmentTotalPesewas"
          :shared-percent="sharedPercent"
          :empty="nothingToAllocate"
          @update:cost="updateCost"
          @edit="editingCostId = $event"
          @leave="editingCostId = null"
          @remove="removeCost"
          @preview="openPreview"
        />
      </div>

      <ShipmentNotesStrip :notes="meta.notes" @update:notes="meta = { ...meta, notes: $event }" />
    </div>
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
  /* Never done on a phone. Below the degrade point the frame scrolls rather
     than reflowing into a layout that was never designed. */
  min-width: 1100px;
  margin: 0 auto;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-1);
  /* Not clipped: the combobox in the create row must be able to open past the
     foot of the table. Every element that reaches a corner is on `--bg`, so
     the radius still reads. */
  overflow: visible;
  /* The reference sets no line-height, so rows sit at the fonts' own metrics. */
  line-height: normal;
}

.panes {
  display: grid;
  grid-template-columns: 1.55fr 1fr;
}

@media (max-width: 1200px) {
  .page {
    padding: 24px;
  }
}
</style>
