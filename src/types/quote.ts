/**
 * The quote builder's view model. Only what a screen renders — the handoff's
 * "What the UI needs to render" list, nothing behind it.
 *
 * Money stays in **integer pesewas** all the way to the formatter, as everywhere
 * else in this app, so nothing rounds a float on the way through. The three
 * money fields he *types* are held as `string`, because they are the text in the
 * field and not yet a number: an empty labour box is not zero labour.
 *
 * The owner's model and the customer's model are two types with nothing shared
 * between them. That is the cost wall, stated where it can be checked: there is
 * no cost field on `CustomerQuote`, so no component rendering her view can be
 * handed one.
 */

import type { ApiQuoteLevel, ApiQuoteStatus } from '@/types/quoteApi'

/**
 * The eight fixed needs, lowercase and in the drawn order. The wire leaves
 * `need` deliberately unconstrained — a smart plug may solve a lighting problem
 * — so a line whose need is not one of these is still rendered rather than
 * dropped; see `needOptions`.
 */
export const NEEDS = [
  'lighting',
  'switching',
  'security',
  'climate',
  'power',
  'networking',
  'sensors',
  'control',
] as const

export type Need = (typeof NEEDS)[number]

/** Her view capitalises them; his never does. */
export const needLabel = (need: string) => need.charAt(0).toUpperCase() + need.slice(1)

/**
 * The needs to offer on a line: the fixed eight, plus the line's own need when
 * it is something else, so a value the API already holds is never silently
 * replaced by the first option in a select.
 */
export function needOptions(current: string): readonly string[] {
  return (NEEDS as readonly string[]).includes(current) ? NEEDS : [current, ...NEEDS]
}

/** What a line is short by, and how long the wait would be. Supplied. */
export interface StockWarning {
  stockOnHand: number
  /** Null when the catalogue does not say. */
  leadDays: number | null
  shortBy: number
}

/** One line of the quote, as both devices render it. */
export interface QuoteLine {
  id: number
  /** Null for whole-house equipment that belongs to no room. */
  roomId: number | null
  /** The room's name as it was when quoted, which a later rename does not move. */
  roomName: string | null
  itemId: number
  /** Null on a stub item → the row renders `Untitled item`. */
  itemName: string | null
  need: string
  quantity: number
  unitPricePesewas: number
  /** OWNER-ONLY. */
  unitCostPesewas: number
  totalPesewas: number
  /** OWNER-ONLY. Derived from the supplied unit cost and quantity. */
  costPesewas: number
  note: string | null
  /** Switched off during negotiation. Out of every total and out of her view. */
  isRemoved: boolean
  removedAt: string | null
  sortOrder: number
  /** Present only when the quantity exceeds stock on hand. */
  stock: StockWarning | null
}

/** OWNER-ONLY money. Every figure here is supplied, not computed on screen. */
export interface QuoteMoney {
  devicePesewas: number
  labourPesewas: number
  /** True while labour is the room count times the rate, rather than his figure. */
  labourIsDerived: boolean
  materialsPesewas: number
  /** True while materials is the misc estimate plus the markup. */
  materialsIsDerived: boolean
  roomCount: number
  proposedPesewas: number
  miscPesewas: number
  /**
   * OWNER-ONLY. What the devices cost him. The wire does not carry it on its
   * own — `cost_total` is device cost *plus* the misc estimate — so it is the
   * one figure here taken apart rather than read off, in the mapper and nowhere
   * else.
   */
  deviceCostPesewas: number
  /** What the money sheet calls the floor: below this he loses money. */
  costPesewas: number
  profitPesewas: number
}

/** The quote itself, less its lines and money. */
export interface QuoteHeader {
  id: number
  customerId: number
  houseId: number
  level: ApiQuoteLevel
  status: ApiQuoteStatus
  title: string | null
  /** When it was written — the date her view puts at the top. */
  createdAt: string
}

/** Everything his view reads. */
export interface QuoteOwnerView {
  header: QuoteHeader
  money: QuoteMoney
  lines: QuoteLine[]
}

/** A room of the quote's house, from the house record. Never typed here. */
export interface QuoteRoom {
  id: number
  name: string
  sortOrder: number
}

/**
 * A room with the two figures the chips and the rail show beside its name.
 * Neither is on the wire: both are counted and summed from the lines the server
 * supplied, which is arithmetic over given figures rather than pricing.
 */
export interface QuoteRoomSummary extends QuoteRoom {
  lineCount: number
  totalPesewas: number
}

/**
 * One need, as her quote groups it. `Installation` and `Materials` arrive as
 * rows of this shape too, so her view renders one list and not three.
 */
export interface CustomerGroup {
  /** Already capitalised, because this is the label and not a key. */
  label: string
  totalPesewas: number
  /** Empty unless he itemised; never cost. */
  items: CustomerItem[]
}

/** One line on her quote. There is no cost field here, and never may be. */
export interface CustomerItem {
  /** `4 × RGB bulb, E27 · Living room` */
  text: string
  totalPesewas: number
}

/**
 * Her whole screen. Built only from `GET /quotes/{id}/customer-view`, except for
 * the three facts that endpoint does not carry — the date, the surname and the
 * room count — which come from the quote, the customer record and the house's
 * rooms. None of those three is a cost, so the wall holds.
 */
export interface CustomerQuote {
  /** `11 October 2026` */
  date: string
  /** `For the Adjei home` is built from this. */
  surname: string
  /** `Comfortable` */
  level: string
  roomCount: number
  groups: CustomerGroup[]
  totalPesewas: number
}

// --- the fields he types ----------------------------------------------------

/**
 * The three money fields, as text. Empty means *he has not set this*, which for
 * labour and materials is what returns them to derived — it is not zero, and the
 * screen must never write a zero he did not type.
 */
export interface ChargesDraft {
  labour: string
  materials: string
  misc: string
}

/** `1,500` → 150000 pesewas. Blank or half-typed reads as nothing. */
export function toPesewas(text: string): number | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const value = Number.parseFloat(trimmed.replace(/,/g, ''))
  return Number.isFinite(value) ? Math.round(value * 100) : null
}

/** Pesewas back into the box, without a currency mark or thousands separator. */
export function fromPesewas(pesewas: number): string {
  return (pesewas / 100).toFixed(2).replace(/\.00$/, '')
}

// --- what the screen counts for itself --------------------------------------

/**
 * The per-room counts and totals. `GET /quotes/{id}/rooms` carries neither, and
 * the chips, the "Other rooms" list and the left rail all show both.
 *
 * Switched-off lines are left out, because they are out of every total.
 */
export function roomSummaries(
  rooms: readonly QuoteRoom[],
  lines: readonly QuoteLine[],
): QuoteRoomSummary[] {
  return rooms.map((room) => {
    const live = lines.filter((line) => !line.isRemoved && line.roomId === room.id)
    return {
      ...room,
      lineCount: live.length,
      totalPesewas: live.reduce((sum, line) => sum + line.totalPesewas, 0),
    }
  })
}

/** One need's lines, for the By need sanity check. Only needs with lines appear. */
export interface NeedGroup {
  need: string
  label: string
  /** The number of units, not the number of lines: `Lighting · 9 points`. */
  points: number
  totalPesewas: number
  costPesewas: number
  lines: QuoteLine[]
}

/** The same lines grouped the other way. Switched-off lines are left out. */
export function needGroups(lines: readonly QuoteLine[]): NeedGroup[] {
  const live = lines.filter((line) => !line.isRemoved)
  const order = [...NEEDS, ...live.map((line) => line.need).filter((n) => !NEEDS.includes(n as Need))]

  return [...new Set(order)]
    .map((need) => {
      const group = live.filter((line) => line.need === need)
      return {
        need,
        label: needLabel(need),
        points: group.reduce((sum, line) => sum + line.quantity, 0),
        totalPesewas: group.reduce((sum, line) => sum + line.totalPesewas, 0),
        costPesewas: group.reduce((sum, line) => sum + line.costPesewas, 0),
        lines: group,
      }
    })
    .filter((group) => group.lines.length > 0)
}
