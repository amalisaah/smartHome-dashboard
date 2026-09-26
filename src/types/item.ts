/**
 * What the item screen renders.
 *
 * The split is the screen's whole argument: `ItemDraft` is what he types,
 * `ItemDerived` is what the system decided and the screen only displays. Money
 * is integer pesewas the whole way to the formatter.
 */

export interface ItemGroupRef {
  id: number
  name: string
}

export interface ItemUnitOption {
  value: string
  label: string
}

/** The left column: every field he types, and nothing else. */
export interface ItemDraft {
  /** Blank → the header renders `Untitled item`. */
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
  photoUrl: string | null
}

/** One dashed card in the right column. Pre-formatted: the screen shows what it is handed. */
export interface DerivedFigure {
  label: string
  figure: string
  /** Where the figure came from — `weighted, 2 shipments`. */
  source: string
}

export type PriceState = 'derived' | 'overridden'

export interface ItemPrice {
  /** The group default, in pesewas — shown in both states. */
  derivedPesewas: number
  /** The multiplier as he reads it: `1.50`. */
  markup: string
  groupName: string
  /** Null while nothing has been overridden. */
  overridePesewas: number | null
  state: PriceState
}

/** Colour of a delta, and nothing else. */
export type MovementKind = 'in' | 'out' | 'loss'

export interface Movement {
  id: number
  /** Already formatted `12 Aug`. */
  date: string
  description: string
  /**
   * The phone row. Held rather than derived from `description`: the frames
   * shorten `Shipment SH-014 received` and `Job JB-031 — Adjei residence` by
   * different rules, so one rule would get one of them wrong.
   */
  shortDescription: string
  delta: number
  /** Stock after this movement. */
  balance: number
  kind: MovementKind
  /**
   * The row leads somewhere — the shipment that brought it, the job that used
   * it. Only those take a hover; a hover on a write-off would promise a screen
   * that isn't there.
   */
  linked?: boolean
}

export interface ItemDerived {
  landedCost: DerivedFigure
  stockOnHand: DerivedFigure
  margin: DerivedFigure
  price: ItemPrice
  /** Newest first, as the ledger endpoint returns them. */
  movements: Movement[]
  /**
   * Stock on hand as a number. The Adjust sheet counts from it — reading it off
   * the ledger's last row would read the *oldest* balance.
   */
  stockCount: number
}

export interface ItemDetail {
  id: number
  draft: ItemDraft
  derived: ItemDerived
  groups: ItemGroupRef[]
  units: ItemUnitOption[]
  savedAt: string
}

/**
 * What `GET /items/{id}` on its own can say. A type of its own because the
 * screen needs three calls and each has its own fate; `toItemDerived` composes
 * them once all three have landed.
 */
export interface ItemRecord {
  id: number
  draft: ItemDraft
  /** Server-derived: quantity-weighted across received lots, 0 if never received. */
  landedCostPesewas: number
  /** Server-derived: **the override if one is set**, else the group default. */
  sellPricePesewas: number
  overridePesewas: number | null
  /** Server-derived: the sum of every movement in the ledger. */
  stockOnHand: number
  /** Resolved on read, so a renamed group is named right without a refetch. */
  groupName: string | null
  /** Set → hidden from the catalogue and from new shipments. */
  archivedAt: string | null
  updatedAt: string
}

export const NO_GROUP_LABEL = 'no group'
export const UNTITLED = 'Untitled item'

/** An item being typed for the first time has no name to head the screen with. */
export const NEW_ITEM_TITLE = 'New item'

/**
 * The id of the item that does not exist yet. Item ids are positive on the wire,
 * so `0` is free to mean *not created* — it addresses nothing, and the only thing
 * that reads it is the draft store, which needs a key to hold what he has typed
 * before the backend has minted the real one.
 */
export const NEW_ITEM_ID = 0

/** Every field empty: what the create screen diffs against to know what he filled in. */
export const blankItemDraft = (): ItemDraft => ({
  name: '',
  groupId: null,
  keywords: [],
  supplier: '',
  supplierLink: '',
  supplierContact: '',
  leadDays: '',
  reorderLevel: '',
  unit: '',
  notes: '',
  photoUrl: null,
})

/**
 * The record behind a blank create form. Every derived figure is zero because
 * nothing has happened to it yet — `toItemDerived` turns that into the captions
 * the screen shows (`never received`, `no price yet`), which are the same words
 * the item will carry the moment after it is created.
 */
export const blankItemRecord = (): ItemRecord => ({
  id: NEW_ITEM_ID,
  draft: blankItemDraft(),
  landedCostPesewas: 0,
  sellPricePesewas: 0,
  overridePesewas: null,
  stockOnHand: 0,
  groupName: null,
  archivedAt: null,
  updatedAt: '',
})

/** One action colour, one risk colour — a loss is the risk one. */
export const DELTA_COLOR: Record<MovementKind, 'action' | 'risk' | 'fg'> = {
  in: 'action',
  loss: 'risk',
  out: 'fg',
}

/** A true minus `−`, never a hyphen. */
export const formatDelta = (delta: number) =>
  delta >= 0 ? `+${delta}` : `−${Math.abs(delta)}`
