<script setup lang="ts">
import { useRouter } from 'vue-router'
import ShipmentCostsPane from '@/components/shipment/ShipmentCostsPane.vue'
import ShipmentHeaderBar from '@/components/shipment/ShipmentHeaderBar.vue'
import ShipmentLinesPane from '@/components/shipment/ShipmentLinesPane.vue'
import ShipmentMetaStrip from '@/components/shipment/ShipmentMetaStrip.vue'
import { useShipmentBuilder } from '@/composables/useShipmentBuilder'
import type { InvoiceLine, SharedCost } from '@/types/shipment'

const router = useRouter()

const {
  meta,
  lines,
  costs,
  online,
  catalogueNames,
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
  addLine,
  clearLineFocus,
  ensureBlankCost,
  removeCost,
} = useShipmentBuilder()

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

const openPreview = () => router.push({ name: 'shipment-preview', params: { ref: meta.value.ref } })
const close = () => router.push({ name: 'shipments' })
</script>

<template>
  <main class="page">
    <!-- C1 — laptop 1440 -->
    <div class="frame">
      <ShipmentHeaderBar
        :shipment-ref="meta.ref"
        :status="saveStatus"
        :offline="!online"
        @close="close"
      />

      <ShipmentMetaStrip :meta="meta" @update:meta="meta = $event" />

      <!-- Two pieces of paper on the desk: the invoice, and what it cost to
           bring it in. Neither goes behind a tab. -->
      <div class="panes">
        <ShipmentLinesPane
          :lines="lines"
          :catalogue-names="catalogueNames"
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
          @update:cost="updateCost"
          @edit="editingCostId = $event"
          @leave="editingCostId = null"
          @remove="removeCost"
          @preview="openPreview"
        />
      </div>
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
