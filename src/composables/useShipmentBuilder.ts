import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import {
  addShipmentLine,
  createItem,
  createShipment,
  removeShipmentLine,
  updateShipment,
  updateShipmentLine,
} from '@/api/shipments'
import type { ApiShipmentDetail, ApiShipmentUpdate } from '@/types/api'
import type { CatalogueItem } from '@/types/catalogue'
import {
  toApiDate,
  toCount,
  toMinor,
  type InvoiceLine,
  type SharedCost,
  type ShipmentMeta,
} from '@/types/shipment'
import {
  formatShipmentRef,
  rateToApi,
  toApiCurrency,
  toInvoiceLine,
  toSharedCost,
  toShipmentMeta,
  unitPriceToPesewas,
} from '@/utils/mapper/shipmentMapper'

/** Everything one draft is, so it can be put down and picked up unchanged. */
interface Draft {
  meta: ShipmentMeta
  lines: InvoiceLine[]
  costs: SharedCost[]
  /** The line ids the server had when this draft was hydrated. */
  serverLineIds: number[]
  nextLineId: number
  nextCostId: number
}

/** The row he types the first cost into. It is there from the first render. */
const blankCost = (): SharedCost => ({ id: 0, label: '', amount: '' })

/** A shipment he has just started: nothing is known, and it has no number. */
function blankDraft(): Draft {
  return {
    meta: {
      id: null,
      ref: '',
      state: 'draft',
      supplier: '',
      orderDate: '',
      invoiceCurrency: 'USD',
      rate: '',
      expectedArrival: '',
      receivedAt: null,
      splitOverridden: false,
      notes: '',
    },
    lines: [],
    costs: [blankCost()],
    serverLineIds: [],
    nextLineId: 1,
    nextCostId: 1,
  }
}

/** What the server has, as the screen edits it. */
function draftFromApi(detail: ApiShipmentDetail, nameFor: (itemId: number) => string): Draft {
  const lines = detail.lines.map((line) =>
    toInvoiceLine(line, nameFor(line.item_id), detail.fx_rate_to_ghs),
  )
  const costs = detail.cost_lines.map(toSharedCost)

  return {
    meta: toShipmentMeta(detail),
    lines,
    costs: [...costs, blankCost()],
    serverLineIds: detail.lines.map((line) => line.id),
    nextLineId: Math.max(0, ...lines.map((line) => line.id)) + 1,
    nextCostId: Math.max(0, ...costs.map((cost) => cost.id)) + 1,
  }
}

/**
 * The draft lives at module scope, not inside the component: the preview is its
 * own route, and coming back from it must find every field exactly as it was
 * left. That is also why typing never waits on the network — it is edited here
 * and written to the API by an action he takes, not by a keystroke.
 *
 * One draft is open at a time, keyed by the shipment's id — `NEW_DRAFT` for the
 * one being started. The others are put down in `stash` whole, so switching
 * between two of them loses nothing.
 */
export const NEW_DRAFT = 'new'
type DraftKey = number | typeof NEW_DRAFT

const initial = blankDraft()
const meta = ref<ShipmentMeta>(initial.meta)
const lines = ref<InvoiceLine[]>(initial.lines)
const costs = ref<SharedCost[]>(initial.costs)

let serverLineIds = initial.serverLineIds
let nextLineId = initial.nextLineId
let nextCostId = initial.nextCostId

let activeKey: DraftKey = NEW_DRAFT
const stash = new Map<DraftKey, Draft>()

const snapshot = (): Draft => ({
  meta: meta.value,
  lines: lines.value,
  costs: costs.value,
  serverLineIds,
  nextLineId,
  nextCostId,
})

function install(draft: Draft, key: DraftKey) {
  meta.value = draft.meta
  lines.value = draft.lines
  costs.value = draft.costs
  serverLineIds = draft.serverLineIds
  nextLineId = draft.nextLineId
  nextCostId = draft.nextCostId
  activeKey = key
}

/** Open the draft this key names, starting a blank one the first time. */
function openDraft(key: DraftKey) {
  if (key === activeKey) return
  stash.set(activeKey, snapshot())
  install(stash.get(key) ?? blankDraft(), key)
}

/**
 * Take the server's copy, but only for a draft this session has not opened yet:
 * once he has typed in it, what is on screen is newer than what came back, and a
 * refetch must never overwrite it.
 */
function hydrate(detail: ApiShipmentDetail, nameFor: (itemId: number) => string) {
  if (activeKey !== detail.id) return
  if (stash.has(detail.id)) return
  const draft = draftFromApi(detail, nameFor)
  stash.set(detail.id, draft)
  install(draft, detail.id)
}

const isBlankCost = (cost: SharedCost) => cost.label === '' && cost.amount === ''

// --- what the screen can see for itself ------------------------------------

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

/**
 * Nothing has been entered yet — no supplier, no line. Saving here would put an
 * empty row on the list, which is the one thing a list of shipments cannot say.
 */
const draftIsEmpty = computed(
  () => lines.value.length === 0 && meta.value.supplier.trim() === '',
)

// --- writing it back --------------------------------------------------------

/** The dot in the header: a state, never a spinner. */
export type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

const saveState = ref<SaveState>('idle')
const saveError = ref<string | null>(null)

function headerBody(): ApiShipmentUpdate {
  const rateHundredths = rateToApi(meta.value.rate)
  const orderedAt = toApiDate(meta.value.orderDate)

  return {
    supplier_name: meta.value.supplier,
    currency: toApiCurrency(meta.value.invoiceCurrency),
    allocation_method: meta.value.splitOverridden ? 'manual' : 'by_value',
    // A date he has not typed is not sent; a cleared arrival is sent as null,
    // which is the difference between "unchanged" and "he took it off".
    ...(orderedAt ? { ordered_at: orderedAt } : {}),
    eta_override: toApiDate(meta.value.expectedArrival),
    ...(rateHundredths > 0 ? { fx_rate_to_ghs: rateHundredths } : {}),
    // Always sent, blank included: clearing the note is a thing he can mean.
    notes: meta.value.notes,
    cost_lines: realCosts.value.map((cost) => ({
      label: cost.label,
      amount_pesewas: toMinor(cost.amount),
    })),
  }
}

/**
 * A line needs an item to point at. One he typed that the catalogue has never
 * heard of becomes a stub item here — named and nothing else, which is exactly
 * the state the preview then asks him to give a group to.
 */
async function itemIdFor(line: InvoiceLine): Promise<number> {
  if (line.itemId !== null) return line.itemId
  const created = await createItem({ name: line.itemName })
  return created.id
}

/**
 * Put the draft on the server. Typing is local and stays local; this is the step
 * he takes when the shipment is real enough to be looked up by ref — and it is
 * what gives it that ref, since the id is the backend's to mint.
 *
 * Returns the shipment's id, or null when there was nothing worth saving.
 */
async function saveDraft(): Promise<number | null> {
  if (draftIsEmpty.value) return meta.value.id

  saveState.value = 'saving'
  saveError.value = null

  try {
    const rateHundredths = rateToApi(meta.value.rate)
    const body = headerBody()

    let id = meta.value.id
    if (id === null) {
      const created = await createShipment({
        supplier_name: body.supplier_name ?? '',
        currency: body.currency ?? 'USD',
        allocation_method: body.allocation_method ?? 'by_value',
        ...(body.ordered_at ? { ordered_at: body.ordered_at } : {}),
        eta_override: body.eta_override ?? null,
        ...(body.fx_rate_to_ghs ? { fx_rate_to_ghs: body.fx_rate_to_ghs } : {}),
        ...(body.notes ? { notes: body.notes } : {}),
      })
      id = created.id
      meta.value = { ...meta.value, id, ref: formatShipmentRef(id) }
      // The draft is the same draft; it is simply no longer the new one.
      stash.delete(NEW_DRAFT)
      activeKey = id
      // Costs are not part of `POST /shipments`, so they follow it.
      if (body.cost_lines?.length) await updateShipment(id, { cost_lines: body.cost_lines })
    } else {
      await updateShipment(id, body)
    }

    for (const line of lines.value) {
      const itemId = await itemIdFor(line)
      const lineBody = {
        item_id: itemId,
        quantity: toCount(line.qty),
        unit_price_pesewas: unitPriceToPesewas(line.unitPrice, rateHundredths),
      }

      if (line.serverId === null) {
        const created = await addShipmentLine(id, lineBody)
        // Written back so a second save updates this line rather than doubling it.
        Object.assign(line, { serverId: created.id, itemId, isNew: false })
      } else {
        await updateShipmentLine(id, line.serverId, lineBody)
        Object.assign(line, { itemId, isNew: false })
      }
    }

    // Anything the server still holds that is no longer on screen.
    const kept = new Set(lines.value.map((line) => line.serverId))
    for (const lineId of serverLineIds) {
      if (!kept.has(lineId)) await removeShipmentLine(id, lineId)
    }
    serverLineIds = lines.value.map((line) => line.serverId).filter((v): v is number => v !== null)

    stash.set(id, snapshot())
    saveState.value = 'saved'
    return id
  } catch (error) {
    // What he typed is still on screen and still his. The row says so; nothing
    // is cleared, nothing is disabled, and he can try the same click again.
    saveState.value = 'failed'
    saveError.value = error instanceof Error ? error.message : 'Could not save this shipment.'
    return null
  }
}

/**
 * `shipmentId` is the draft to open — the builder passes the one in its URL, and
 * `detail` is what `GET /shipments/{id}` came back with for it. The composable
 * fetches nothing itself: the view owns the queries, as the catalogue does.
 */
export function useShipmentBuilder(
  shipmentId: MaybeRefOrGetter<number | null>,
  detail: MaybeRefOrGetter<ApiShipmentDetail | undefined>,
  items: MaybeRefOrGetter<CatalogueItem[]>,
  /** Whether the catalogue request has answered — an empty catalogue is an answer. */
  itemsSettled: MaybeRefOrGetter<boolean>,
) {
  const key = computed<DraftKey>(() => toValue(shipmentId) ?? NEW_DRAFT)

  // Synchronously, before the first render: the screen never shows one
  // shipment's lines while it waits for a watcher to swap in another's.
  openDraft(key.value)
  watch(key, openDraft)

  const catalogueItems = computed(() => toValue(items))

  /** The names the combobox searches, and what a line's item_id is called. */
  const pickableItems = computed(() =>
    catalogueItems.value
      .filter((item): item is CatalogueItem & { name: string } => item.name !== null)
      .map((item) => ({ id: item.id, name: item.name })),
  )

  const nameFor = (itemId: number) =>
    catalogueItems.value.find((item) => item.id === itemId)?.name ?? `Item ${itemId}`

  watch(
    [() => toValue(detail), () => toValue(itemsSettled)],
    ([served, settled]) => {
      // A line's name comes from the catalogue, so hydrating waits for it to
      // answer — but an empty catalogue is an answer, and a shipment with no
      // lines has no name to look up at all.
      if (served && settled) hydrate(served, nameFor)
    },
    { immediate: true },
  )

  /**
   * What the dot is saying. It no longer claims "saved on this device": the
   * shipment lives on the server now, and a draft he has not saved would not
   * survive a refresh — so it says that instead of something comforting.
   */
  const saveStatus = computed(() => {
    if (saveState.value === 'saving') return 'saving…'
    if (saveState.value === 'failed') return saveError.value ?? 'Not saved'
    if (saveState.value === 'saved') return `saved · ${lineCount.value} lines`
    return meta.value.id === null
      ? `not saved yet · ${lineCount.value} lines`
      : `saved · ${lineCount.value} lines`
  })

  // --- entering lines ------------------------------------------------------

  /** The line whose Qty field should take focus once it has rendered. */
  const focusLineId = ref<number | null>(null)
  /** The cost row being typed in; it renders as fields until it is left. */
  const editingCostId = ref<number | null>(null)

  /**
   * A line arrives in place: the row appears where the create row was, focus
   * stays in the table and moves to Qty. Nothing navigates, nothing opens, and
   * nothing is sent — an item the catalogue lacks is created when he saves.
   */
  function addLine(itemName: string, itemId: number | null) {
    const line: InvoiceLine = {
      id: nextLineId++,
      serverId: null,
      itemId,
      itemName,
      isNew: itemId === null,
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
    pickableItems,
    focusLineId,
    editingCostId,
    isBlankCost,
    draftIsEmpty,
    saveDraft,
    saveState,
    saveStatus,
    lineCount,
    unitCount,
    invoiceSubtotal,
    lineTotal,
    productPesewas,
    costCount,
    sharedPesewas,
    shipmentTotalPesewas,
    sharedPercent,
    addLine,
    clearLineFocus,
    ensureBlankCost,
    removeCost,
  }
}
