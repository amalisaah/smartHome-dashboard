<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useShipmentDetails, useShipments } from '@/api/hooks/shipments'
import { SBanner, SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import ShipmentsTableRow from '@/components/shipment/ShipmentsTableRow.vue'
import type { ShipmentListRow } from '@/types/shipment'
import { toShipmentListRow, toShipmentTotals } from '@/utils/mapper/shipmentMapper'

const router = useRouter()

const shipmentsQuery = useShipments()

/**
 * `GET /shipments` carries no totals, so each row's Units / Product / Shared come
 * from its own detail. They arrive after the rows do and fill in; a row never
 * waits on them, and never shows a zero it has not been told.
 */
const ids = computed(() => (shipmentsQuery.data.value ?? []).map((shipment) => shipment.id))
const details = useShipmentDetails(ids)

const rows = computed<ShipmentListRow[]>(() =>
  (shipmentsQuery.data.value ?? []).map((shipment) => {
    const detail = details.value.byId.get(shipment.id)
    return toShipmentListRow(shipment, detail ? toShipmentTotals(detail) : undefined)
  }),
)

const COLUMNS = [
  { label: 'Ref', numeric: false },
  { label: 'Supplier', numeric: false },
  { label: 'Ordered at', numeric: false },
  { label: 'Product Cost', numeric: true },
  { label: 'Misc Cost', numeric: true },
  { label: 'State', numeric: true },
]

/** A draft opens where it is still being entered; a received one opens read-only. */
function open(row: ShipmentListRow) {
  const name = row.state === 'draft' ? 'shipment-builder' : 'shipment-preview'
  router.push({ name, params: { id: row.id } })
}

/** A blank form, at a route that says so. It is numbered when it is saved. */
const newShipment = () => router.push({ name: 'shipment-new' })
</script>

<template>
  <!-- C3 — drawn at 1100, on the app's 1440 frame -->
  <AppLayout>
    <div class="header">
      <SText type="frame-title" as="h1">Shipments</SText>
      <SButton size="md" @click="newShipment">New shipment</SButton>
    </div>

    <SBanner
      v-if="shipmentsQuery.isError.value"
      variant="error"
      label="error"
      title="Couldn't load shipments."
    >
      {{ (shipmentsQuery.error.value as Error)?.message }}
    </SBanner>

    <div role="table" aria-label="Shipments">
      <div class="head" role="row">
        <SText
          v-for="column in COLUMNS"
          :key="column.label"
          type="column-header"
          color="micro"
          role="columnheader"
          :class="{ num: column.numeric }"
        >
          {{ column.label }}
        </SText>
      </div>

      <ShipmentsTableRow v-for="row in rows" :key="row.id" :row="row" @open="open(row)" />

      <div v-if="!rows.length" class="empty">
        <SText type="cell" color="fg-2-soft">
          {{ shipmentsQuery.isPending.value ? 'Loading shipments…' : 'No shipments yet.' }}
        </SText>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-line);
}

.head {
  display: grid;
  grid-template-columns: 0.8fr 1.6fr 0.8fr 1fr 1fr 1.2fr;
  gap: 14px;
  padding: 10px 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.num {
  text-align: right;
}

.empty {
  padding: 20px;
}
</style>
