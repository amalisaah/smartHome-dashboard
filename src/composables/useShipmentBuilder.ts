import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import { fetchGroups, fetchItems } from '@/api/catalogue'
import {
  blankDraftMeta,
  DRAFT_COSTS,
  DRAFT_LINES,
  DRAFT_META,
  MOCK_SHIPMENTS,
} from '@/data/shipmentMock'
import type { CatalogueGroupRef } from '@/types/catalogue'
import {
  toCount,
  toIsoDate,
  toMinor,
  type InvoiceLine,
  type SharedCost,
  type ShipmentListRow,
  type ShipmentMeta,
} from '@/types/shipment'

/** Everything one draft is, so it can be put down and picked up unchanged. */
interface Draft {
  meta: ShipmentMeta
  lines: InvoiceLine[]
  costs: SharedCost[]
  nextLineId: number
  nextCostId: number
}

/**
 * A shipment he has just started has no ref: a ref is what you call a shipment
 * that exists, and this one does not yet. `''` is that state everywhere — the
 * key it is stashed under, and what `meta.ref` holds until it is saved.
 */
export const NEW_DRAFT = ''

/**
 * A draft he has not started is empty — the sample lines belong to the sample
 * shipment and to no other. The blank cost row is there from the first render:
 * it is the row he types the first cost into, not a row that appears later.
 */
function seedDraft(ref: string): Draft {
  if (ref !== DRAFT_META.ref) {
    return {
      meta: blankDraftMeta(ref),
      lines: [],
      costs: [{ id: 0, label: '', amount: '' }],
      nextLineId: 1,
      nextCostId: 1,
    }
  }

  return {
    meta: { ...DRAFT_META },
    lines: DRAFT_LINES.map((line) => ({ ...line })),
    costs: [...DRAFT_COSTS.map((cost) => ({ ...cost })), { id: 0, label: '', amount: '' }],
    nextLineId: DRAFT_LINES.length + 1,
    nextCostId: DRAFT_COSTS.length + 1,
  }
}

/**
 * The draft lives at module scope, not inside the component: the preview is its
 * own route, and coming back from it must find every field exactly as it was
 * left. That is what "saved on this device" promises, and it is the reason
 * nothing in this screen may wait on the network.
 *
 * One draft is open at a time — the one whose ref is in the URL, or the new one
 * that has no ref yet. The others are put down in `stash` whole, so switching
 * between two drafts loses nothing.
 */
const initial = seedDraft(DRAFT_META.ref)
const meta = ref<ShipmentMeta>(initial.meta)
const lines = ref<InvoiceLine[]>(initial.lines)
const costs = ref<SharedCost[]>(initial.costs)

let nextLineId = initial.nextLineId
let nextCostId = initial.nextCostId

let activeRef = DRAFT_META.ref
const stash = new Map<string, Draft>()

/**
 * Open the draft this ref names — `NEW_DRAFT` for the one being started — and
 * seed a blank one the first time.
 */
function openDraft(ref: string) {
  if (ref === activeRef) return

  stash.set(activeRef, {
    meta: meta.value,
    lines: lines.value,
    costs: costs.value,
    nextLineId,
    nextCostId,
  })

  const draft = stash.get(ref) ?? seedDraft(ref)
  meta.value = draft.meta
  lines.value = draft.lines
  costs.value = draft.costs
  nextLineId = draft.nextLineId
  nextCostId = draft.nextCostId
  activeRef = ref
}

/** `SH-015` → 15; anything else is not a ref this mints from. */
function refNumber(ref: string): number {
  const value = Number.parseInt(ref.replace(/^SH-/, ''), 10)
  return Number.isFinite(value) ? value : 0
}

let lastRefNumber = MOCK_SHIPMENTS.reduce((max, row) => Math.max(max, refNumber(row.ref)), 0)

/**
 * Give the open draft the ref it will be called by. Saving is what does this —
 * a blank form he may abandon is not a shipment and has no number, so nothing
 * is minted until there is something to number.
 */
function mintRef(): string {
  lastRefNumber += 1
  return `SH-${String(lastRefNumber).padStart(3, '0')}`
}

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

// --- what the screen can see for itself ------------------------------------
// Derived from the open draft, at module scope with it: the preview reads the
// same figures the builder does, and neither recomputes them per component.

const lineCount = computed(() => lines.value.length)
const unitCount = computed(() => lines.value.reduce((total, line) => total + toCount(line.qty), 0))

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
  productPesewas.value === 0 ? 0 : Math.round((sharedPesewas.value / productPesewas.value) * 100),
)

// --- putting the draft on the list -----------------------------------------

/**
 * The drafts he has saved, newest first. They sit above the sample data on the
 * shipments list; a saved `SH-015` is his version of it, not the sample's.
 */
const savedDrafts = ref<ShipmentListRow[]>([])

export const savedShipments = computed<ShipmentListRow[]>(() => {
  const saved = new Set(savedDrafts.value.map((row) => row.ref))
  return [...savedDrafts.value, ...MOCK_SHIPMENTS.filter((row) => !saved.has(row.ref))]
})

/**
 * Nothing has been entered yet — no supplier, no line. Saving here would put an
 * empty row on the list, which is the one thing a list of shipments cannot say.
 */
const draftIsEmpty = computed(
  () => lines.value.length === 0 && meta.value.supplier.trim() === '',
)

/**
 * Put the open draft on the shipments list. Typing is already saved on this
 * device — what this adds is the shipment being *listed*, which is the step he
 * takes once it is real enough to look up by ref. Returns the ref it now has.
 */
function saveDraft(): string {
  if (draftIsEmpty.value) return meta.value.ref

  // The moment it becomes a shipment is the moment it gets a number.
  if (meta.value.ref === NEW_DRAFT) {
    meta.value = { ...meta.value, ref: mintRef() }
    activeRef = meta.value.ref
  }

  const row: ShipmentListRow = {
    ref: meta.value.ref,
    supplier: meta.value.supplier,
    units: unitCount.value,
    productPesewas: productPesewas.value,
    sharedPesewas: sharedPesewas.value,
    state: 'draft',
    stateDate: toIsoDate(meta.value.expectedArrival),
    splitOverridden: meta.value.splitOverridden,
  }

  const index = savedDrafts.value.findIndex((saved) => saved.ref === row.ref)
  if (index === -1) savedDrafts.value.unshift(row)
  else savedDrafts.value[index] = row

  return row.ref
}

/**
 * `shipmentRef` is the draft to open — the builder passes the one in its URL.
 * The preview passes nothing: it opens over whichever draft is already open.
 */
export function useShipmentBuilder(shipmentRef?: MaybeRefOrGetter<string>) {
  if (shipmentRef !== undefined) {
    // Synchronously, before the first render: the screen never shows one
    // shipment's lines while it waits for a watcher to swap in another's.
    openDraft(toValue(shipmentRef))
    watch(() => toValue(shipmentRef), openDraft)
  }

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
    try {
      const [items, groupRefs] = await Promise.all([fetchItems(), fetchGroups()])
      catalogueNames.value = items
        .map((item) => item.name)
        .filter((name): name is string => name !== null)
      groups.value = groupRefs
    } catch {
      // The combobox simply has nothing to offer. Cleared so the next visit to
      // the screen tries again rather than being stuck with no matches for good.
      catalogueRequested = false
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

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
    const line: InvoiceLine = {
      id: nextLineId++,
      itemName,
      isNew,
      qty: '',
      unitPrice: '',
    }
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
    draftIsEmpty,
    saveDraft,
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
