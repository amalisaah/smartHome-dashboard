/**
 * The view model the shipment builder renders.
 *
 * Money is integer minor units all the way to the formatter — pesewas for cedi
 * figures, cents for the invoice currency — so nothing rounds a float on the way
 * through. The fields he types (dates, qty, unit price, a cost's amount) stay
 * strings: they are the text in the field, not a parsed number, and the screen
 * is never allowed to reformat what he is in the middle of typing.
 *
 * Allocation is not modelled here. Every figure on the preview arrives given —
 * share, cash added, landed cost, selling price, margin — because what the
 * freight did to each item is a product rule, not a UI one.
 */

export type ShipmentState = 'draft' | 'received'

/** The header bar and the meta strip. */
export interface ShipmentMeta {
  ref: string
  state: ShipmentState
  supplier: string
  /** `03 Sep 2026` — what the field holds. */
  orderDate: string
  invoiceCurrency: string
  /** The rate he got at the forex shop. Not a market rate, never fetched. */
  rate: string
  expectedArrival: string
  /** ISO, set once received. */
  receivedAt: string | null
  /** He decided this shipment's split by hand. */
  splitOverridden: boolean
}

export interface InvoiceLine {
  id: number
  itemName: string
  /** Created in this shipment — not in the catalogue yet. */
  isNew: boolean
  qty: string
  /** In the invoice currency. */
  unitPrice: string
}

/** He names his own costs; there are no fixed freight / duty / other fields. */
export interface SharedCost {
  id: number
  label: string
  /** Cedis. */
  amount: string
}

export type AllocationBasis = 'by-value' | 'override'

/** One row of the allocation preview. Figures are given, not computed. */
export interface PreviewRow {
  id: number
  itemName: string
  isNew: boolean
  /** Absent → no markup to apply, and the row blocks receiving. */
  group: string | null
  /** Basis points — 5000 = a markup of 1.50. */
  markupBps: number | null
  qty: number
  productPesewas: number
  /** One decimal, per the display conventions. */
  sharePercent: number
  sharedAddedPesewas: number
  landedUnitPesewas: number
  /** Absent → a first-ever cost, and the was-line says so. */
  previousLandedUnitPesewas: number | null
  /** Absent → blocked: there is no group, so there is no price to show. */
  sellPricePesewas: number | null
  previousSellPricePesewas: number | null
  marginPercent: number | null
  blocksReceiving: boolean
  /** He put this price there by hand; receiving will not move it. */
  priceOverridden: boolean
}

/** The one-line read-out, with the figure that earned the emphasis. */
export interface ReadoutSentence {
  lead: string
  emphasis: string
  tail: string
}

export type ChipTone = 'neutral' | 'warn' | 'action'

export interface ReadoutChip {
  text: string
  tone: ChipTone
}

/** A split he decided himself, and the reason he gave for it. */
export interface OverrideRow {
  reason: string
  percent: string
}

/** One line of the receive dialog's consequence list. */
export interface ConsequenceLine {
  figure: string
  tone: ChipTone
  text: string
}

/** Everything C2 renders for one shipment. */
export interface AllocationPreview {
  rows: PreviewRow[]
  sentence: ReadoutSentence
  chips: ReadoutChip[]
  overrides: OverrideRow[]
  /** What is left for everything else, as drawn: `60%`. */
  remainder: string
}

/** A row of the shipments list. */
export interface ShipmentListRow {
  ref: string
  supplier: string
  units: number
  productPesewas: number
  sharedPesewas: number
  state: ShipmentState
  /**
   * ISO — the expected arrival on a draft, the received date on a received one.
   * Absent on a draft he has not said when to expect: the chip says so rather
   * than inventing a date.
   */
  stateDate: string | null
  splitOverridden: boolean
}

// --- reading the fields he types -------------------------------------------

/** `1,240.00` → 124000 minor units. Half-typed or blank reads as nothing. */
export function toMinor(text: string): number {
  const value = Number.parseFloat(text.replace(/,/g, ''))
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

/**
 * `24 Sep 2026` → `2026-09-24`. The date fields hold what he typed, so a
 * half-typed or nonsense date reads as no date at all rather than as a wrong one.
 */
export function toIsoDate(text: string): string | null {
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

/** `20` → 20. A count is never fractional. */
export function toCount(text: string): number {
  const value = Number.parseInt(text.replace(/,/g, ''), 10)
  return Number.isFinite(value) ? value : 0
}

/**
 * How far a figure moved, as the was-line reports it: a signed whole percent,
 * or nothing at all when there is no previous figure to have moved from.
 */
export function movePercent(now: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null
  return Math.round(((now - previous) / previous) * 100)
}
