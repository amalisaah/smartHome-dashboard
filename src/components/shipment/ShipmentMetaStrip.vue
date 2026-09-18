<script setup lang="ts">
import { computed } from 'vue'
import { SInput, SSelect } from '@/components/atoms'
import { INVOICE_CURRENCIES } from '@/data/shipmentMock'
import type { ShipmentMeta } from '@/types/shipment'

const props = defineProps<{ meta: ShipmentMeta }>()

const emit = defineEmits<{ 'update:meta': [meta: ShipmentMeta] }>()

const patch = (fields: Partial<ShipmentMeta>) => emit('update:meta', { ...props.meta, ...fields })

const currencyOptions = INVOICE_CURRENCIES.map((code) => ({ label: code, value: code }))

/** The prefix tracks the currency: it is a rate *for* whatever he was invoiced in. */
const ratePrefix = computed(() => `1 ${props.meta.invoiceCurrency} =`)
</script>

<template>
  <div class="strip">
    <SInput
      label="Supplier"
      size="field"
      :model-value="meta.supplier"
      @update:model-value="patch({ supplier: $event })"
    />
    <SInput
      label="Order date"
      size="field"
      mono
      :model-value="meta.orderDate"
      @update:model-value="patch({ orderDate: $event })"
    />
    <SSelect
      label="Invoice currency"
      size="field"
      :options="currencyOptions"
      :model-value="meta.invoiceCurrency"
      @update:model-value="patch({ invoiceCurrency: $event })"
    />
    <!-- The rate he got at the forex shop. There is no live rate to fetch. -->
    <SInput
      label="Rate you actually got"
      size="field"
      mono
      align="right"
      :prefix="ratePrefix"
      :model-value="meta.rate"
      @update:model-value="patch({ rate: $event })"
    />
    <SInput
      label="Expected arrival"
      size="field"
      mono
      :model-value="meta.expectedArrival"
      @update:model-value="patch({ expectedArrival: $event })"
    />
  </div>
</template>

<style scoped>
.strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  padding: 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}
</style>
