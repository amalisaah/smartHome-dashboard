<script setup lang="ts">
import { useRouter } from 'vue-router'
import { SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import ShipmentsTableRow from '@/components/shipment/ShipmentsTableRow.vue'
import { DRAFT_META, MOCK_SHIPMENTS } from '@/data/shipmentMock'
import type { ShipmentListRow } from '@/types/shipment'

const router = useRouter()

const COLUMNS = [
  { label: 'Ref', numeric: false },
  { label: 'Supplier', numeric: false },
  { label: 'Units', numeric: true },
  { label: 'Product', numeric: true },
  { label: 'Shared', numeric: true },
  { label: 'State', numeric: true },
]

/** A draft opens where it is still being entered; a received one opens read-only. */
function open(row: ShipmentListRow) {
  const name = row.state === 'draft' ? 'shipment-builder' : 'shipment-preview'
  router.push({ name, params: { ref: row.ref } })
}

const newShipment = () =>
  router.push({ name: 'shipment-builder', params: { ref: DRAFT_META.ref } })
</script>

<template>
  <!-- C3 — drawn at 1100, on the app's 1440 frame -->
  <AppLayout>
    <div class="header">
      <SText type="frame-title" as="h1">Shipments</SText>
      <SButton size="md" @click="newShipment">New shipment</SButton>
    </div>

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

      <ShipmentsTableRow
        v-for="row in MOCK_SHIPMENTS"
        :key="row.ref"
        :row="row"
        @open="open(row)"
      />
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
</style>
