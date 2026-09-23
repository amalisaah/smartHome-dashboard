/**
 * What the item-detail screen renders. Not a data model — the handoff's "What
 * the UI needs to render" list, typed.
 *
 * The split is the screen's whole argument: `ItemDraft` is what he types and the
 * screen owns, `ItemDerived` is what the system decides and the screen only
 * displays. Nothing here computes a cost, a price or a balance — this handoff is
 * UI and UX, so every figure arrives already decided.
 *
 * Money is integer pesewas the whole way to the formatter, as everywhere else in
 * this app, so nothing rounds a float on the way through.
 */

/** A group as the select offers it and the header chip names it. */
export interface ItemGroupRef {
  id: number
  name: string
}

/** The unit select's options. */
export interface ItemUnitOption {
  value: string
  label: string
}

/** The left column: every field he types, and nothing else. */
export interface ItemDraft {
  /** Blank → the header renders `Untitled item` in `--fg-3`. */
  name: string
  /** Null → the header chip renders a dashed `no group` in risk. */
  groupId: number | null
  keywords: string[]
  supplier: string
  supplierLink: string
  supplierContact: string
  /** Kept as typed, not as a number: an emptied field is blank, not 0. */
  leadDays: string
  reorderLevel: string
  unit: string
  notes: string
  /** No photo yet — the drop zone shows its striped placeholder. */
  photoUrl: string | null
}

/** One dashed card in the right column: a figure the system decided. */
export interface DerivedFigure {
  label: string
  /** Already formatted. The screen shows the figure it is handed. */
  figure: string
  /** Where the figure came from — `weighted, 2 shipments`. */
  source: string
}

/**
 * Which of the two prices is in effect. The screen shows one state at a time;
 * the derived figure stays visible in the formula line while overridden, so
 * returning to it is visible rather than remembered.
 */
export type PriceState = 'derived' | 'overridden'

export interface ItemPrice {
  /** Integer pesewas — what the group markup arrives at. */
  derivedPesewas: number
  /** The multiplier as he reads it: `1.50`. */
  markup: string
  /** Names the markup in the formula line — `switching markup`. */
  groupName: string
  /** Integer pesewas, or null while nothing has been overridden. */
  overridePesewas: number | null
  state: PriceState
}

/** Colour of a delta, and nothing else: the design system has one risk colour. */
export type MovementKind = 'in' | 'out' | 'loss'

export interface Movement {
  id: number
  /** Already formatted `12 Aug` — the movements convention. */
  date: string
  /** The laptop row, which has the width for the whole phrase. */
  description: string
  /**
   * The phone row, which does not. Held rather than derived: the frames shorten
   * `Shipment SH-014 received` and `Job JB-031 — Adjei residence` by different
   * rules, so one rule would get one of them wrong.
   */
  shortDescription: string
  /** Signed. Rendered with a true minus `−`, never a hyphen. */
  delta: number
  /** Stock after this movement. */
  balance: number
  kind: MovementKind
  /**
   * The row goes somewhere — the shipment that brought it, the job that used
   * it. Only a row that leads anywhere takes a hover; a write-off is a fact
   * with nothing behind it, and a hover on it would promise a screen that
   * isn't there.
   */
  linked?: boolean
}

/** Everything the right column displays, all of it already decided. */
export interface ItemDerived {
  landedCost: DerivedFigure
  stockOnHand: DerivedFigure
  margin: DerivedFigure
  price: ItemPrice
  movements: Movement[]
}

export interface ItemDetail {
  id: number
  draft: ItemDraft
  derived: ItemDerived
  /** The eight groups the select offers. */
  groups: ItemGroupRef[]
  units: ItemUnitOption[]
  /** When the screen last saved. The header timestamp reads from this. */
  savedAt: string
}

/** What the header chip renders when nothing has been filed into a group. */
export const NO_GROUP_LABEL = 'no group'

/** What the header renders in place of a name that has been emptied. */
export const UNTITLED = 'Untitled item'

/** The delta's ink. One action colour, one risk colour — a loss is the risk one. */
export const DELTA_COLOR: Record<MovementKind, 'action' | 'risk' | 'fg'> = {
  in: 'action',
  loss: 'risk',
  out: 'fg',
}

/** A true minus, per the handoff's display conventions. */
export const formatDelta = (delta: number) =>
  delta >= 0 ? `+${delta}` : `−${Math.abs(delta)}`
