import type { ApiAllocationMethod, ApiCurrency, ApiShipment, ApiShipmentLine } from '@/types/api'
import type { CatalogueGroupRef, CatalogueItem } from '@/types/catalogue'
import type {
  AllocationBasis,
  InvoiceLine,
  PreviewRow,
  SharedCost,
  ShipmentListRow,
  ShipmentMeta,
} from '@/types/shipment'

/**
 * Wire → view model for shipments, and back. Four things are reconciled here and
 * nowhere else, because they are the four places the API and the screen disagree:
 *
 *   - **The ref.** The backend numbers shipments; `SH-016` is how he says that
 *     number out loud. It is a rendering of the id, never a second identity.
 *   - **The rate.** `fx_rate_to_ghs` is the rate ×100 and is *recorded only* —
 *     every pesewas figure on the wire is already GHS. The builder types a unit
 *     price in the invoice currency, so the rate converts on the way out and back.
 *   - **Dates.** The fields hold what he typed (`24 Sep 2026`); the API takes and
 *     returns ISO instants.
 *   - **The split.** `manual` is what the screen calls overriding the split.
 */

/** `16` → `SH-016`. Padded to three so a year of shipments sorts as text. */
export const formatShipmentRef = (id: number) => `SH-${String(id).padStart(3, '0')}`

/** The screen writes `GH₵`; the wire says `GHS`. Everything else is its own code. */
export const toApiCurrency = (code: string): ApiCurrency =>
  code === 'GH₵' ? 'GHS' : (code as ApiCurrency)

/** `1240` → `12.40`. Two decimals, because that is how a forex rate is quoted. */
export const rateFromApi = (hundredths: number) => (hundredths / 100).toFixed(2)

/** `12.40` → `1240`. A rate he did not type reads as no rate at all. */
export function rateToApi(text: string): number {
  const value = Number.parseFloat(text.replace(/,/g, ''))
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

/**
 * The split, both ways. Three methods on the wire, three on the screen — the
 * screen just calls `manual` *overriding* the split, because choosing it is him
 * saying no rule fits this shipment.
 */
const BASIS_BY_METHOD: Record<ApiAllocationMethod, AllocationBasis> = {
  by_value: 'by-value',
  per_unit: 'per-unit',
  manual: 'override',
}

const METHOD_BY_BASIS: Record<AllocationBasis, ApiAllocationMethod> = {
  'by-value': 'by_value',
  'per-unit': 'per_unit',
  override: 'manual',
}

export const basisFromApi = (method: ApiAllocationMethod): AllocationBasis =>
  BASIS_BY_METHOD[method] ?? 'by-value'

export const basisToApi = (basis: AllocationBasis): ApiAllocationMethod => METHOD_BY_BASIS[basis]

/** `2026-09-24T00:00:00.000Z` → `2026-09-24`, which is what the date field holds. */
export function dateFromApi(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function toShipmentMeta(api: ApiShipment): ShipmentMeta {
  return {
    id: api.id,
    ref: formatShipmentRef(api.id),
    state: api.status,
    supplier: api.supplier_name,
    orderDate: dateFromApi(api.ordered_at),
    invoiceCurrency: api.currency,
    rate: rateFromApi(api.fx_rate_to_ghs),
    // The field is the date he was quoted. `eta` is the backend's estimate from
    // lead times, which is a different claim and does not belong in his field.
    expectedArrival: dateFromApi(api.eta_override),
    receivedAt: api.received_at,
    basis: basisFromApi(api.allocation_method),
    notes: api.notes ?? '',
  }
}

/** The list row. `GET /shipments` totals each shipment itself, header and all. */
export function toShipmentListRow(api: ApiShipment): ShipmentListRow {
  return {
    id: api.id,
    ref: formatShipmentRef(api.id),
    supplier: api.supplier_name,
    productPesewas: api.product_value_total_pesewas,
    sharedPesewas: api.shared_cost_total_pesewas,
    state: api.status,
    // A draft is going to arrive; a received one already did.
    stateDate: api.status === 'received' ? api.received_at : api.eta,
    orderedAt: api.ordered_at,
    notes: api.notes,
    basis: basisFromApi(api.allocation_method),
  }
}

/**
 * A line, priced back into the invoice currency he typed it in. At `GHS`, or
 * before he has entered a rate, the two are the same figure.
 */
export function toInvoiceLine(
  api: ApiShipmentLine,
  itemName: string,
  rateHundredths: number,
): InvoiceLine {
  const rate = rateHundredths > 0 ? rateHundredths / 100 : 1
  return {
    id: api.id,
    serverId: api.id,
    itemId: api.item_id,
    itemName,
    // Every line that came back is an item the catalogue already holds.
    isNew: false,
    qty: String(api.quantity),
    unitPrice: (api.unit_price_pesewas / 100 / rate).toFixed(2),
  }
}

/** `14.20` in USD at 12.40 → 17608 pesewas of GHS, which is what the wire wants. */
export function unitPriceToPesewas(unitPrice: string, rateHundredths: number): number {
  const value = Number.parseFloat(unitPrice.replace(/,/g, ''))
  if (!Number.isFinite(value)) return 0
  const rate = rateHundredths > 0 ? rateHundredths / 100 : 1
  return Math.round(value * 100 * rate)
}

export function toSharedCost(api: { id: number; label: string; amount_pesewas: number }): SharedCost {
  return { id: api.id, label: api.label, amount: (api.amount_pesewas / 100).toFixed(2) }
}

/**
 * One row of the allocation preview.
 *
 * The API allocates — share, cash added, landed cost — and the catalogue says
 * what that does to a price: the group carries the markup, and the markup is the
 * price. A row whose item has no group has no price to show and blocks
 * receiving, which is the same rule the frame was drawn with.
 */
export function toPreviewRow(
  line: ApiShipmentLine,
  item: CatalogueItem | undefined,
  group: CatalogueGroupRef | undefined,
  sharedTotalPesewas: number,
): PreviewRow {
  const landed = line.landed_unit_cost_pesewas ?? 0
  const added = line.allocated_shared_cost_pesewas ?? 0
  const markupBps = group?.defaultMarkupBps ?? null
  const overridden = item?.priceOverridden ?? false

  // A price he put there by hand stays where he put it; every other price is
  // the new landed cost grown by the group's markup.
  const sell = overridden
    ? (item?.sellPricePesewas ?? null)
    : markupBps === null
      ? null
      : Math.round(landed * (1 + markupBps / 10_000))

  // Zero is the backend's "never received", which is a first cost, not a fall.
  const previousLanded =
    item && item.landedCostPesewas > 0 ? item.landedCostPesewas : null

  return {
    id: line.id,
    itemId: line.item_id,
    itemName: item?.name ?? `Item ${line.item_id}`,
    isNew: previousLanded === null,
    group: item?.group?.name ?? null,
    markupBps,
    qty: line.quantity,
    productPesewas: line.line_product_value_pesewas ?? 0,
    sharePercent: sharedTotalPesewas === 0 ? 0 : (added / sharedTotalPesewas) * 100,
    sharedAddedPesewas: added,
    manualPesewas: line.manual_allocation_pesewas,
    landedUnitPesewas: landed,
    previousLandedUnitPesewas: previousLanded,
    sellPricePesewas: sell,
    // Zero, or no price at all, is an item that has never had one: there is no
    // was-line to draw, and the row says `first cost` instead.
    previousSellPricePesewas: item?.sellPricePesewas ? item.sellPricePesewas : null,
    marginPercent: sell === null || sell === 0 ? null : Math.round(((sell - landed) / sell) * 100),
    // No group, no markup, no price — and nothing to receive it at.
    blocksReceiving: item?.group == null,
    priceOverridden: overridden,
  }
}
