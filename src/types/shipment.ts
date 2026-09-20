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

export type ShipmentState = "draft" | "received";

/** The header bar and the meta strip. */
export interface ShipmentMeta {
  /** The backend's id, and null until `POST /shipments` has given it one. */
  id: number | null;
  /** How he says it out loud — `SH-016`, derived from the id. Empty until saved. */
  ref: string;
  state: ShipmentState;
  supplier: string;
  /** ISO `2026-09-03` — what the date field holds, and empty until one is picked. */
  orderDate: string;
  invoiceCurrency: string;
  /** The rate he got at the forex shop. Not a market rate, never fetched. */
  rate: string;
  expectedArrival: string;
  /** ISO, set once received. */
  receivedAt: string | null;
  /** How the shared costs are spread on this shipment. */
  basis: AllocationBasis;
  /** What he wrote in the notes field. */
  notes: string;
}

export interface InvoiceLine {
  /** Local, and the key the table renders by — a row exists before it is saved. */
  id: number;
  /** The line's id on the backend, null until it has been posted. */
  serverId: number | null;
  /** The catalogue item this line buys, null while it is still only a name. */
  itemId: number | null;
  itemName: string;
  /** Created in this shipment — not in the catalogue yet. */
  isNew: boolean;
  qty: string;
  /** In the invoice currency. */
  unitPrice: string;
}

/** He names his own costs; there are no fixed freight / duty / other fields. */
export interface SharedCost {
  id: number;
  label: string;
  /** Cedis. */
  amount: string;
}

/**
 * How the shared costs get spread. The wire calls these `by_value`, `per_unit`
 * and `manual`; `override` is what the screen calls the last one, because from
 * his side it is not a method so much as taking the method off.
 */
export type AllocationBasis = "by-value" | "per-unit" | "override";

/** One row of the allocation preview. Figures are given, not computed. */
export interface PreviewRow {
  /** The shipment line's id. */
  id: number;
  /** The catalogue item it buys — what a group assigned here is written to. */
  itemId: number;
  itemName: string;
  isNew: boolean;
  /** Absent → no markup to apply, and the row blocks receiving. */
  group: string | null;
  /** Basis points — 5000 = a markup of 1.50. */
  markupBps: number | null;
  qty: number;
  productPesewas: number;
  /** One decimal, per the display conventions. */
  sharePercent: number;
  sharedAddedPesewas: number;
  /**
   * Under `override`, what he said this line carries. Null is a line he has not
   * spoken for — the backend takes it as nothing, so the total comes up short
   * and receiving says so.
   */
  manualPesewas: number | null;
  landedUnitPesewas: number;
  /** Absent → a first-ever cost, and the was-line says so. */
  previousLandedUnitPesewas: number | null;
  /** Absent → blocked: there is no group, so there is no price to show. */
  sellPricePesewas: number | null;
  previousSellPricePesewas: number | null;
  marginPercent: number | null;
  blocksReceiving: boolean;
  /** He put this price there by hand; receiving will not move it. */
  priceOverridden: boolean;
}

/** The one-line read-out, with the figure that earned the emphasis. */
export interface ReadoutSentence {
  lead: string;
  emphasis: string;
  tail: string;
}

export type ChipTone = "neutral" | "warn" | "action";

export interface ReadoutChip {
  text: string;
  tone: ChipTone;
}

/** One line of the receive dialog's consequence list. */
export interface ConsequenceLine {
  figure: string;
  tone: ChipTone;
  text: string;
}

/** A row of the shipments list. */
export interface ShipmentListRow {
  id: number;
  ref: string;
  supplier: string;
  /** Totalled by the list endpoint itself — the row never adds anything up. */
  productPesewas: number;
  sharedPesewas: number;
  state: ShipmentState;
  /**
   * ISO — the expected arrival on a draft, the received date on a received one.
   * Absent on a draft he has not said when to expect: the chip says so rather
   * than inventing a date.
   */
  stateDate: string | null;
  orderedAt: string | null;
  notes: string | null;
  /** The row says so only when it is not the default. */
  basis: AllocationBasis;
}

// --- reading the fields he types -------------------------------------------

/** `1,240.00` → 124000 minor units. Half-typed or blank reads as nothing. */
export function toMinor(text: string): number {
  const value = Number.parseFloat(text.replace(/,/g, ""));
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

/**
 * `24 Sep 2026` → `2026-09-24`. The date fields hold what he typed, so a
 * half-typed or nonsense date reads as no date at all rather than as a wrong one.
 */
export function toIsoDate(text: string): string | null {
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/**
 * The same date as the API takes it: a full ISO instant at midnight UTC. The
 * fields on this screen are days, not moments — the time is a formality the
 * contract requires, not something he chose.
 */
export function toApiDate(text: string): string | null {
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.toISOString().slice(0, 10)}T00:00:00.000Z`;
}

/** `20` → 20. A count is never fractional. */
export function toCount(text: string): number {
  const value = Number.parseInt(text.replace(/,/g, ""), 10);
  return Number.isFinite(value) ? value : 0;
}

/**
 * How far a figure moved, as the was-line reports it: a signed whole percent,
 * or nothing at all when there is no previous figure to have moved from.
 */
export function movePercent(
  now: number,
  previous: number | null,
): number | null {
  if (previous === null || previous === 0) return null;
  return Math.round(((now - previous) / previous) * 100);
}
