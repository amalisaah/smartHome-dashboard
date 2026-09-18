import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchCatalogue } from '@/api/catalogue'
import { DRAFT_COSTS, DRAFT_LINES, DRAFT_META } from '@/data/shipmentMock'
import type { CatalogueGroupRef } from '@/types/catalogue'
import {
  toCount,
  toMinor,
  type InvoiceLine,
  type SharedCost,
  type ShipmentMeta,
} from '@/types/shipment'

/**
 * The draft lives at module scope, not inside the component: the preview is its
 * own route, and coming back from it must find every field exactly as it was
 * left. That is what "saved on this device" promises, and it is the reason
 * nothing in this screen may wait on the network.
 */
const meta = ref<ShipmentMeta>({ ...DRAFT_META })
const lines = ref<InvoiceLine[]>(DRAFT_LINES.map((line) => ({ ...line })))
const costs = ref<SharedCost[]>([
  ...DRAFT_COSTS.map((cost) => ({ ...cost })),
  { id: 0, label: '', amount: '' },
])

let nextLineId = DRAFT_LINES.length + 1
let nextCostId = DRAFT_COSTS.length + 1

/** The catalogue the inline-create row searches, and the groups it can pick. */
const catalogueNames = ref<string[]>([])
const groups = ref<CatalogueGroupRef[]>([])
let catalogueRequested = false

/** The line whose Qty field should take focus once it has rendered. */
const focusLineId = ref<number | null>(null)
/** The cost row being typed in; it renders as fields until it is left. */
const editingCostId = ref<number | null>(null)

const online = ref(true)

const isBlankCost = (cost: SharedCost) => cost.label === '' && cost.amount === ''

export function useShipmentBuilder() {
  const handleOnline = () => (online.value = true)
  const handleOffline = () => (online.value = false)

  onMounted(async () => {
    online.value = navigator.onLine
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // The catalogue fills the combobox in the background. It never gates typing:
    // until it lands there are simply no matches to offer.
    if (catalogueRequested) return
    catalogueRequested = true
    const payload = await fetchCatalogue()
    catalogueNames.value = payload.items
      .map((item) => item.name)
      .filter((name): name is string => name !== null)
    groups.value = payload.groups
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  // --- what the screen can see for itself ----------------------------------
  const lineCount = computed(() => lines.value.length)
  const unitCount = computed(() =>
    lines.value.reduce((total, line) => total + toCount(line.qty), 0),
  )

  /** In the invoice currency's minor units. A line is qty × the unit price. */
  const invoiceSubtotal = computed(() =>
    lines.value.reduce((total, line) => total + toCount(line.qty) * toMinor(line.unitPrice), 0),
  )

  const lineTotal = (line: InvoiceLine) => toCount(line.qty) * toMinor(line.unitPrice)

  /** At the rate he actually got, which is the only rate this screen knows. */
  const rate = computed(() => {
    const value = Number.parseFloat(meta.value.rate.replace(/,/g, ''))
    return Number.isFinite(value) ? value : 0
  })

  const productPesewas = computed(() => Math.round(invoiceSubtotal.value * rate.value))

  const realCosts = computed(() => costs.value.filter((cost) => !isBlankCost(cost)))
  const costCount = computed(() => realCosts.value.length)
  const sharedPesewas = computed(() =>
    realCosts.value.reduce((total, cost) => total + toMinor(cost.amount), 0),
  )

  const shipmentTotalPesewas = computed(() => productPesewas.value + sharedPesewas.value)

  /** Integers everywhere but the Share column. */
  const sharedPercent = computed(() =>
    productPesewas.value === 0
      ? 0
      : Math.round((sharedPesewas.value / productPesewas.value) * 100),
  )

  const saveStatus = computed(() =>
    online.value
      ? `saved on this device · ${lineCount.value} lines`
      : 'No connection — showing last known counts',
  )

  // --- entering lines ------------------------------------------------------

  /**
   * A line arrives in place: the row appears where the create row was, focus
   * stays in the table and moves to Qty. Nothing navigates, nothing opens.
   */
  function addLine(itemName: string, isNew: boolean) {
    const line: InvoiceLine = { id: nextLineId++, itemName, isNew, qty: '', unitPrice: '' }
    lines.value.push(line)
    focusLineId.value = line.id
    return line
  }

  function clearLineFocus() {
    focusLineId.value = null
  }

  // --- naming costs -------------------------------------------------------

  /** The blank row is always the last row; typing in it spawns the next one. */
  function ensureBlankCost() {
    const last = costs.value[costs.value.length - 1]
    if (!last || !isBlankCost(last)) {
      costs.value.push({ id: nextCostId++, label: '', amount: '' })
    }
  }

  function removeCost(id: number) {
    costs.value = costs.value.filter((cost) => cost.id !== id)
    ensureBlankCost()
  }

  return {
    meta,
    lines,
    costs,
    online,
    catalogueNames,
    groups,
    focusLineId,
    editingCostId,
    isBlankCost,
    lineCount,
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
  }
}
