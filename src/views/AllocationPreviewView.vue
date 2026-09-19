<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AllocationActionBar from '@/components/shipment/AllocationActionBar.vue'
import AllocationOverridePanel from '@/components/shipment/AllocationOverridePanel.vue'
import AllocationPreviewHeader from '@/components/shipment/AllocationPreviewHeader.vue'
import AllocationPreviewTable from '@/components/shipment/AllocationPreviewTable.vue'
import AllocationReadout from '@/components/shipment/AllocationReadout.vue'
import ReceiveDialog from '@/components/shipment/ReceiveDialog.vue'
import { NEW_DRAFT, useShipmentBuilder } from '@/composables/useShipmentBuilder'
import {
  MOCK_PREVIEW,
  MOCK_SHIPMENTS,
  MOVED_ENOUGH_THRESHOLD_PERCENT,
  metaForShipment,
} from '@/data/shipmentMock'
import type { AllocationBasis, OverrideRow, PreviewRow } from '@/types/shipment'

const props = defineProps<{ shipmentRef: string }>()

const router = useRouter()

const { meta, groups, lines, unitCount, productPesewas, sharedPesewas, saveDraft } =
  useShipmentBuilder()

/**
 * A received shipment is history: its figures come from the list, not the draft.
 * The unsaved one has nothing to look up — it is the draft that is open.
 */
const shipment = computed(() =>
  props.shipmentRef === NEW_DRAFT ? meta.value : metaForShipment(props.shipmentRef),
)
const readOnly = computed(() => shipment.value.state === 'received')

const listRow = computed(() => MOCK_SHIPMENTS.find((row) => row.ref === props.shipmentRef))

const productTotal = computed(() =>
  readOnly.value ? (listRow.value?.productPesewas ?? 0) : productPesewas.value,
)
const sharedTotal = computed(() =>
  readOnly.value ? (listRow.value?.sharedPesewas ?? 0) : sharedPesewas.value,
)
const units = computed(() => (readOnly.value ? (listRow.value?.units ?? 0) : unitCount.value))
const lineCount = computed(() => (readOnly.value ? rows.value.length : lines.value.length))

// Local UI state: the basis he is looking at, and any split he has typed.
const basis = ref<AllocationBasis>('by-value')
const rows = ref<PreviewRow[]>(MOCK_PREVIEW.rows.map((row) => ({ ...row })))
const overrides = ref<OverrideRow[]>(MOCK_PREVIEW.overrides.map((row) => ({ ...row })))
const confirming = ref(false)

/**
 * Picking the group in the row that blocks is what unblocks it: the group is
 * where the markup comes from, and the markup is the price. It is the same rule
 * every other row on this table was drawn with — landed cost × the multiplier.
 * There is no previous price to compare against, so that row carries no
 * was-line; what a first-ever price should say there is not designed yet.
 */
function assignGroup(rowId: number, slug: string) {
  const group = groups.value.find((candidate) => candidate.slug === slug)
  const index = rows.value.findIndex((row) => row.id === rowId)
  if (!group || index === -1 || group.defaultMarkupBps === undefined) return

  const row = rows.value[index]
  const sell = Math.round(row.landedUnitPesewas * (1 + group.defaultMarkupBps / 10_000))
  rows.value[index] = {
    ...row,
    group: group.name,
    markupBps: group.defaultMarkupBps,
    blocksReceiving: false,
    sellPricePesewas: sell,
    marginPercent: sell === 0 ? null : Math.round(((sell - row.landedUnitPesewas) / sell) * 100),
  }
}

function setOverride(index: number, percent: string) {
  overrides.value[index] = { ...overrides.value[index], percent }
}

const backToLines = () =>
  shipment.value.ref === NEW_DRAFT
    ? router.push({ name: 'shipment-new' })
    : router.push({ name: 'shipment-builder', params: { ref: shipment.value.ref } })

const toList = () => router.push({ name: 'shipments' })

/** `Keep as draft` files it on the list, the same as saving from the builder. */
function keepAsDraft() {
  saveDraft()
  toList()
}

/** Escape on the preview is `Back to lines` — the same exit, by keyboard. */
function onKeydown(event: KeyboardEvent) {
  // The dialog above has its own Escape, and it answers first.
  if (event.key !== 'Escape' || confirming.value) return
  if (readOnly.value) toList()
  else backToLines()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

function receive() {
  confirming.value = false
  // Receiving is the act that makes it real if saving had not already: a
  // shipment whose stock has landed is on the list, with a number.
  saveDraft()
  // What receiving actually does to stock and costs is the next module.
  toList()
}
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
        @update:basis="basis = $event"
      />

      <AllocationPreviewTable
        :rows="rows"
        :moved-threshold="MOVED_ENOUGH_THRESHOLD_PERCENT"
        :groups="groups"
        :read-only="readOnly"
        @assign-group="assignGroup"
      />

      <div class="band">
        <AllocationReadout :sentence="MOCK_PREVIEW.sentence" :chips="MOCK_PREVIEW.chips" />
        <AllocationOverridePanel
          :overrides="overrides"
          :remainder="MOCK_PREVIEW.remainder"
          :read-only="readOnly"
          @update:percent="setOverride"
        />
      </div>

      <AllocationActionBar
        :unit-count="units"
        :read-only="readOnly"
        :received-at="shipment.receivedAt"
        @back="backToLines"
        @draft="keepAsDraft"
        @receive="confirming = true"
        @close="toList"
      />
    </div>

    <ReceiveDialog
      v-if="confirming"
      :shipment-ref="shipment.ref"
      :unit-count="units"
      :line-count="lineCount"
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
