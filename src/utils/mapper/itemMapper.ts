import type { CatalogueGroupRef } from '@/types/catalogue'
import type {
  DerivedFigure,
  ItemDerived,
  ItemDraft,
  ItemGroupRef,
  ItemPrice,
  ItemRecord,
  Movement,
  MovementKind,
} from '@/types/item'
import type { ApiItemCreate } from '@/types/api'
import type { ApiItemDetail, ApiItemUpdate, ApiMovement, ApiMovementReason } from '@/types/itemApi'
import { formatMarkup, formatMoney, formatShortDate } from '@/utils/format'
import { formatShipmentRef } from '@/utils/mapper/shipmentMapper'

/**
 * Wire → the item screen's view model. Pure functions; `@/api/item` calls them.
 *
 * **Four things the screen draws are not fields on any endpoint**, and are
 * derived here:
 *
 *   1. A movement's **running balance** — walked back from the server's own
 *      `stock_on_hand` rather than accumulated from zero, so the column agrees
 *      with the card above it even if the ledger is ever paginated.
 *   2. A movement's **description** — `reason` + `reference_id` + `note`
 *      composed. See `describe`.
 *   3. **The group default while overridden.** `selling_price_pesewas` *is* the
 *      override once one is set, so the figure the formula line offers to return
 *      to is rebuilt from the landed cost and the group's markup — which lives
 *      on `GET /groups`, not on the item.
 *   4. **`weighted, 2 shipments`** — counted off the ledger's distinct
 *      `shipment_in` references, since the lot count is not returned.
 *
 * Formatting: the cards and rows are label / figure / caption triples, so those
 * strings are built here. Anything a component re-formats for itself (a price, a
 * delta, a balance) stays a number.
 */

/** `31` → `JB-031`. Jobs have no endpoint yet; the convention is the shipments'. */
export const formatJobRef = (id: number) => `JB-${String(id).padStart(3, '0')}`

const orEmpty = (value: string | null) => value ?? ''

/** Held as typed, so an emptied field is blank and not 0. */
const orBlank = (value: number | null) => (value === null ? '' : String(value))

export function toItemDraft(api: ApiItemDetail): ItemDraft {
  return {
    name: orEmpty(api.name),
    groupId: api.group_id,
    keywords: api.keywords,
    supplier: orEmpty(api.supplier_name),
    supplierLink: orEmpty(api.supplier_url),
    supplierContact: orEmpty(api.supplier_contact),
    leadDays: orBlank(api.lead_time_days),
    reorderLevel: String(api.reorder_level),
    unit: orEmpty(api.unit),
    notes: orEmpty(api.notes),
    photoUrl: api.image_url,
  }
}

export function toItemRecord(api: ApiItemDetail): ItemRecord {
  return {
    id: api.id,
    draft: toItemDraft(api),
    landedCostPesewas: api.landed_unit_cost_pesewas,
    sellPricePesewas: api.selling_price_pesewas,
    overridePesewas: api.selling_price_override_pesewas,
    stockOnHand: api.stock_on_hand,
    groupName: api.group?.name ?? null,
    archivedAt: api.archived_at,
    updatedAt: api.updated_at,
  }
}

/** `GET /groups` order is already `sort_order`. */
export const toItemGroups = (groups: CatalogueGroupRef[]): ItemGroupRef[] =>
  groups.map((group) => ({ id: group.id, name: group.name }))

// --- movements --------------------------------------------------------------

/** `damage` takes the risk ink; a job issue of the same size does not. */
function toKind(reason: ApiMovementReason, delta: number): MovementKind {
  if (reason === 'damage') return 'loss'
  return delta > 0 ? 'in' : 'out'
}

/** The long form is the laptop row; the short form is the phone's. */
function describe(row: ApiMovement): { description: string; shortDescription: string } {
  const note = row.note?.trim() ?? ''

  switch (row.reason) {
    case 'shipment_in': {
      const ref = row.reference_id === null ? 'Shipment' : `Shipment ${formatShipmentRef(row.reference_id)}`
      return { description: note ? `${ref} — ${note}` : `${ref} received`, shortDescription: ref }
    }
    case 'job_out': {
      const ref = row.reference_id === null ? 'Job' : `Job ${formatJobRef(row.reference_id)}`
      return { description: note ? `${ref} — ${note}` : ref, shortDescription: ref }
    }
    case 'return': {
      const ref = 'Returned to stock'
      return { description: note ? `${ref} — ${note}` : ref, shortDescription: ref }
    }
    case 'damage':
      return {
        description: note ? `${note} — written off` : 'Written off',
        shortDescription: note || 'Written off',
      }
    case 'adjustment':
      return { description: note || 'Count corrected', shortDescription: note || 'Count corrected' }
  }
}

/**
 * Newest first, as the endpoint returns. `stockOnHand` anchors the balances: the
 * newest row's balance *is* stock on hand, and each older row's is the one after
 * it less that row's delta.
 */
export function toMovements(rows: ApiMovement[], stockOnHand: number): Movement[] {
  let balance = stockOnHand

  return rows.map((row) => {
    const after = balance
    balance -= row.quantity_delta

    return {
      id: row.id,
      date: formatShortDate(row.occurred_at),
      ...describe(row),
      delta: row.quantity_delta,
      balance: after,
      kind: toKind(row.reason, row.quantity_delta),
      linked: row.reference_id !== null,
    }
  })
}

// --- the derived column -----------------------------------------------------

/** How many received lots the weighted average is an average of. */
function lotCount(movements: ApiMovement[]): number {
  const lots = new Set<number>()
  for (const row of movements) {
    if (row.reason === 'shipment_in' && row.reference_id !== null) lots.add(row.reference_id)
  }
  return lots.size
}

/** A caption that cannot count says less rather than guessing. */
function landedCostSource(movements: ApiMovement[] | null, landedPesewas: number): string {
  if (landedPesewas === 0) return 'never received'
  if (movements === null) return 'weighted average'
  const lots = lotCount(movements)
  if (lots === 0) return 'weighted average'
  return `weighted, ${lots} shipment${lots === 1 ? '' : 's'}`
}

/**
 * `derivedPesewas` is the group default. Un-overridden that is exactly
 * `selling_price_pesewas`; overridden, the server has replaced that field, so it
 * is rebuilt from the landed cost and the markup. No group, no markup — the
 * server's figure stands in.
 */
function toItemPrice(record: ItemRecord, markupBps: number | null): ItemPrice {
  const overridden = record.overridePesewas !== null

  const rebuilt =
    markupBps === null
      ? record.sellPricePesewas
      : Math.round(record.landedCostPesewas * (1 + markupBps / 10_000))

  return {
    derivedPesewas: overridden ? rebuilt : record.sellPricePesewas,
    markup: formatMarkup(markupBps ?? 0),
    groupName: record.groupName ?? 'no group',
    overridePesewas: record.overridePesewas,
    state: overridden ? 'overridden' : 'derived',
  }
}

const figure = (label: string, value: string, source: string): DerivedFigure => ({
  label,
  figure: value,
  source,
})

/** `movements` may be null: the ledger is its own query with its own fate. */
export function toItemDerived(
  record: ItemRecord,
  markupBps: number | null,
  movements: ApiMovement[] | null,
): ItemDerived {
  const price = toItemPrice(record, markupBps)

  // Not a field on any endpoint: the two figures beside it, against the price
  // actually in effect — the override when there is one.
  const sell = record.sellPricePesewas
  const perUnit = sell - record.landedCostPesewas
  const percent = sell === 0 ? null : Math.round((perUnit / sell) * 100)

  return {
    landedCost: figure(
      'Landed cost',
      formatMoney(record.landedCostPesewas),
      landedCostSource(movements, record.landedCostPesewas),
    ),
    stockOnHand: figure(
      'Stock on hand',
      String(record.stockOnHand),
      `reorder at ${record.draft.reorderLevel || '0'}`,
    ),
    margin: figure(
      'Margin',
      percent === null ? '—' : `${percent}%`,
      percent === null ? 'no price yet' : `${formatMoney(perUnit)} per unit`,
    ),
    price,
    movements: movements === null ? [] : toMovements(movements, record.stockOnHand),
    stockCount: record.stockOnHand,
  }
}

// --- view model → wire ------------------------------------------------------

/** What a `PATCH` was asked to do but the endpoint has no way to express. */
export type UnexpressibleClear = 'group' | 'leadTime'

/** A whole number as typed, or undefined when the field holds nothing usable. */
function whole(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed === '' || !/^\d+$/.test(trimmed)) return undefined
  return Number(trimmed)
}

export interface ItemUpdatePlan {
  body: ApiItemUpdate
  /**
   * Clears the wire cannot carry. Non-empty means a partial write, and the field
   * comes back holding its old value. Surfaced rather than swallowed.
   */
  unexpressible: UnexpressibleClear[]
}

/**
 * A draft back onto the wire. Blank text goes as `""` — accepted, and the screen
 * reads it as blank. A blank group or lead time is **omitted** and reported in
 * `unexpressible`: null is a 400 and 0 would be a different claim. See
 * `ApiItemUpdate` for what each limitation costs.
 *
 * The override is not here, because it is the one field the screen decides from
 * two places — the input and the derived/overridden state. The caller sets
 * `selling_price_override_pesewas` itself: a figure, or null to price it by the
 * group markup again.
 */
export function toItemUpdate(draft: ItemDraft): ItemUpdatePlan {
  const unexpressible: UnexpressibleClear[] = []

  const leadDays = whole(draft.leadDays)
  if (leadDays === undefined && draft.leadDays.trim() === '') unexpressible.push('leadTime')
  if (draft.groupId === null) unexpressible.push('group')

  const body: ApiItemUpdate = {
    name: draft.name.trim(),
    keywords: draft.keywords,
    unit: draft.unit.trim(),
    supplier_name: draft.supplier.trim(),
    supplier_url: draft.supplierLink.trim(),
    supplier_contact: draft.supplierContact.trim(),
    reorder_level: whole(draft.reorderLevel) ?? 0,
    notes: draft.notes.trim(),
  }

  if (draft.groupId !== null) body.group_id = draft.groupId
  if (leadDays !== undefined) body.lead_time_days = leadDays
  if (draft.photoUrl !== null) body.image_url = draft.photoUrl

  return { body, unexpressible }
}

/**
 * A draft onto `POST /items`. **An empty field is omitted** rather than sent as
 * `""`: nothing here is a clear, so the API's own defaults are the right answer
 * for it — which is also why this has no `unexpressible`. A group he did not pick
 * is not a group he emptied.
 */
export function toItemCreate(draft: ItemDraft): ApiItemCreate {
  const body: ApiItemCreate = {}

  const text = (value: string) => {
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  }

  const name = text(draft.name)
  if (name) body.name = name
  if (draft.groupId !== null) body.group_id = draft.groupId
  if (draft.keywords.length > 0) body.keywords = [...draft.keywords]

  const unit = text(draft.unit)
  if (unit) body.unit = unit

  const supplier = text(draft.supplier)
  if (supplier) body.supplier_name = supplier

  const supplierLink = text(draft.supplierLink)
  if (supplierLink) body.supplier_url = supplierLink

  const supplierContact = text(draft.supplierContact)
  if (supplierContact) body.supplier_contact = supplierContact

  const leadDays = whole(draft.leadDays)
  if (leadDays !== undefined) body.lead_time_days = leadDays

  const reorderLevel = whole(draft.reorderLevel)
  if (reorderLevel !== undefined) body.reorder_level = reorderLevel

  const notes = text(draft.notes)
  if (notes) body.notes = notes

  if (draft.photoUrl !== null) body.image_url = draft.photoUrl

  return body
}

/**
 * `360.00` → `36000`. Blank is the request to return to the group default, which
 * the caller sends as a null override; `invalid` is refused rather than rounded
 * into something he did not type.
 */
export type OverrideIntent =
  | { kind: 'set'; pesewas: number }
  | { kind: 'clear' }
  | { kind: 'invalid' }

export function toOverrideIntent(typed: string): OverrideIntent {
  const trimmed = typed.trim().replace(/,/g, '')
  if (trimmed === '') return { kind: 'clear' }
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return { kind: 'invalid' }
  return { kind: 'set', pesewas: Math.round(Number(trimmed) * 100) }
}
