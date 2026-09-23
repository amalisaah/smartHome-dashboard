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
import type { ApiItemDetail, ApiItemUpdate, ApiMovement, ApiMovementReason } from '@/types/itemApi'
import { formatMarkup, formatMoney, formatShortDate } from '@/utils/format'
import { formatShipmentRef } from '@/utils/mapper/shipmentMapper'

/**
 * Wire → the item screen's view model. Pure functions over the shapes in
 * `@/types/itemApi`; `@/api/item` calls them on what comes back.
 *
 * **What the wire cannot answer, and what is derived here instead.** Four things
 * the screen draws are not fields on any endpoint:
 *
 *   1. **A movement's running balance.** The ledger is append-only and carries
 *      only each row's delta. Walked back from the server's own `stock_on_hand`
 *      rather than accumulated forward from zero, so the figures are anchored on
 *      a number the server computed and stay right even if the ledger is ever
 *      paginated or filtered.
 *   2. **A movement's description.** The wire gives `reason`, a numeric
 *      `reference_id` and a free-text `note`; `Shipment SH-014 received` is those
 *      three composed. See `describe`.
 *   3. **The group default price while an override is in effect.**
 *      `selling_price_pesewas` *is* the override once one is set, so the figure
 *      the formula line offers to return to has to be recomputed from the landed
 *      cost and the group's markup — and the markup is not on the item, only on
 *      `GET /groups`. This is the one place the screen does price arithmetic, and
 *      it does it because the endpoint stops being able to say the answer at
 *      exactly the moment the screen needs to show both.
 *   4. **`weighted, 2 shipments`.** The number of lots behind a weighted average
 *      is not returned; it is counted off the ledger's distinct `shipment_in`
 *      references. It is a caption about the figure above it, so a ledger that
 *      failed to load leaves the caption unqualified rather than wrong.
 *
 * On formatting: the derived cards and movement rows are label / figure /
 * caption triples by design — the screen's job is to show a figure it was
 * handed, not to decide it — so those strings are built here. Everything a
 * component needs to re-format for itself (the price, a delta, a balance) stays
 * a number: the phone says `Sell` without decimals off the same pesewas the
 * laptop shows to two.
 */

/** `31` → `JB-031`. Jobs have no endpoint yet; the convention is the shipments'. */
export const formatJobRef = (id: number) => `JB-${String(id).padStart(3, '0')}`

/** A blank field is absent, not an empty string — the wire's null is the truth. */
const orEmpty = (value: string | null) => value ?? ''

/** A figure he types is held as typed, so an emptied field is blank and not 0. */
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

/** The Group select's options. `GET /groups` order is already `sort_order`. */
export const toItemGroups = (groups: CatalogueGroupRef[]): ItemGroupRef[] =>
  groups.map((group) => ({ id: group.id, name: group.name }))

// --- movements --------------------------------------------------------------

/**
 * Colour, and nothing else. Positive is a receipt; `damage` is the loss that
 * takes the risk ink even though a job issue of the same size does not — one is
 * stock gone to nothing, the other is stock gone to a customer.
 */
function toKind(reason: ApiMovementReason, delta: number): MovementKind {
  if (reason === 'damage') return 'loss'
  return delta > 0 ? 'in' : 'out'
}

/**
 * The row's words, composed from what the wire has. The long form is the laptop
 * row, which has the width for the whole phrase; the short form is the phone
 * row, which does not, and is the document it came from where there is one.
 */
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
      // The note is the whole story here, and the screen's own vocabulary for a
      // write-off is the note he typed into the Adjust sheet.
      return {
        description: note ? `${note} — written off` : 'Written off',
        shortDescription: note || 'Written off',
      }
    case 'adjustment':
      return { description: note || 'Count corrected', shortDescription: note || 'Count corrected' }
  }
}

/**
 * The ledger as the screen reads it, newest first — the order the endpoint
 * already returns.
 *
 * `stockOnHand` anchors the balances: the newest row's balance *is* stock on
 * hand, and each older row's is the one after it less that row's delta. Walking
 * back from the server's figure rather than forward from zero means the column
 * agrees with the dashed card above it by construction.
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
      // Only a row with a record behind it leads anywhere. A manual adjustment
      // has no reference, and a hover on it would promise a screen that is not
      // there.
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

/**
 * `weighted, 2 shipments` — and, when the ledger has not landed, `weighted
 * average` on its own. A caption that cannot count says less rather than
 * guessing: the figure above it is the server's either way.
 */
function landedCostSource(movements: ApiMovement[] | null, landedPesewas: number): string {
  if (landedPesewas === 0) return 'never received'
  if (movements === null) return 'weighted average'
  const lots = lotCount(movements)
  if (lots === 0) return 'weighted average'
  return `weighted, ${lots} shipment${lots === 1 ? '' : 's'}`
}

/**
 * The price, in both its states.
 *
 * `derivedPesewas` is the group default — what the item would sell for on its
 * markup alone. Un-overridden that is exactly `selling_price_pesewas`. Overridden,
 * the server has replaced that field with the override, so the default is rebuilt
 * from the landed cost and the markup; without a group there is no markup, and
 * the server's own figure stands in.
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

/**
 * Everything the right column displays. `movements` may be null — the ledger is
 * its own query with its own fate — in which case the movements card has no rows
 * and the landed-cost caption stops counting lots.
 */
export function toItemDerived(
  record: ItemRecord,
  markupBps: number | null,
  movements: ApiMovement[] | null,
): ItemDerived {
  const price = toItemPrice(record, markupBps)

  // Margin is not a field on any endpoint. It is the two figures beside it —
  // against the price actually in effect, which is the override when there is
  // one, because that is what the item sells for.
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
  }
}

// --- view model → wire ------------------------------------------------------

/** What a `PATCH` was asked to do but the endpoint has no way to express. */
export type UnexpressibleClear = 'group' | 'leadTime'

export interface ItemUpdatePlan {
  body: ApiItemUpdate
  /**
   * Clears the screen asked for and the wire cannot carry. Non-empty means the
   * write is a partial one, and the field will come back holding its old value
   * on the next read. Surfaced rather than swallowed: a field that silently
   * refuses to clear is worse than one that says it did not.
   */
  unexpressible: UnexpressibleClear[]
}

/**
 * A draft back onto the wire, with the clears the endpoint cannot take left out
 * and reported instead — see `ApiItemUpdate` for what each of them costs.
 *
 * Blank text goes as `""`, which the API accepts and the screen reads as blank,
 * so those clears are real. A blank group or lead time is **omitted**: `null` is
 * a 400 and `0` would be a different claim, so leaving the field untouched is
 * the least-wrong write, and the caller is told.
 *
 * `reorder_level` is genuinely non-nullable — a blank one is 0, and 0 means
 * "tell me when it hits zero", which is a real answer rather than a missing one.
 *
 * The price override is not here at all: it is written on its own, because
 * setting it and returning to the group default are not the same operation and
 * only one of them exists on the wire.
 */
export function toItemUpdate(draft: ItemDraft): ItemUpdatePlan {
  const unexpressible: UnexpressibleClear[] = []

  const whole = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '' || !/^\d+$/.test(trimmed)) return undefined
    return Number(trimmed)
  }

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
 * The override as typed. `360.00` → `36000`. `blank` is the request to return to
 * the group default, which the wire cannot carry; `invalid` is anything that is
 * not a figure, refused rather than rounded into something he did not type.
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
