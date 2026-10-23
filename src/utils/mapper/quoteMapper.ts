/**
 * Wire ↔ view model for the quote builder. Pure functions: nothing here fetches,
 * and nothing here prices.
 *
 * Inbound is `toXxx`, outbound `toXxxPatch`, as elsewhere in this folder. The
 * outbound convention is the one `@/api/houses` sets: a key left `undefined` is
 * not sent and means *unchanged*; `null` is sent and means *he cleared it*. On
 * the charges patch that distinction is the whole feature — `null` is what hands
 * labour or materials back to the server to derive again.
 */

import { formatLongDate } from '@/utils/format'
import { needLabel, type CustomerGroup, type CustomerQuote, type QuoteLine, type QuoteMoney, type QuoteOwnerView, type QuoteRoom } from '@/types/quote'
import type {
  ApiQuoteChargesUpdate,
  ApiQuoteCustomerView,
  ApiQuoteLine,
  ApiQuoteLineBulkUpdate,
  ApiQuoteLineUpdate,
  ApiQuoteMoney,
  ApiQuoteOwnerView,
  ApiQuoteRoom,
} from '@/types/quoteApi'

/** The line's own cost is the supplied unit cost times the supplied quantity. */
export function toQuoteLine(line: ApiQuoteLine): QuoteLine {
  return {
    id: line.id,
    roomId: line.room_id,
    roomName: line.room?.name ?? null,
    itemId: line.item_id,
    itemName: line.item_name,
    need: line.need,
    quantity: line.quantity,
    unitPricePesewas: line.unit_selling_price_pesewas,
    unitCostPesewas: line.unit_landed_cost_pesewas,
    totalPesewas: line.line_selling_total_pesewas,
    costPesewas: line.unit_landed_cost_pesewas * line.quantity,
    note: line.note,
    isRemoved: line.is_removed,
    removedAt: line.removed_at,
    sortOrder: line.sort_order,
    stock: line.stock_warning
      ? {
          stockOnHand: line.stock_warning.stock_on_hand,
          leadDays: line.stock_warning.lead_time_days,
          shortBy: line.stock_warning.short_by,
        }
      : null,
  }
}

export function toQuoteMoney(money: ApiQuoteMoney): QuoteMoney {
  return {
    devicePesewas: money.device_total_pesewas,
    labourPesewas: money.labour_charge_pesewas,
    labourIsDerived: money.labour_charge_is_derived,
    materialsPesewas: money.materials_charge_pesewas,
    materialsIsDerived: money.materials_charge_is_derived,
    roomCount: money.room_count,
    proposedPesewas: money.proposed_total_pesewas,
    miscPesewas: money.misc_cost_estimate_pesewas,
    // `cost_total` is the device landed cost plus the misc estimate, as the
    // endpoint documents it. The money box shows the device half on its own, so
    // the misc half comes back off here — once, where it can be read against
    // the contract, rather than in a template.
    deviceCostPesewas: money.cost_total_pesewas - money.misc_cost_estimate_pesewas,
    costPesewas: money.cost_total_pesewas,
    profitPesewas: money.expected_profit_pesewas,
  }
}

/** `GET /quotes/{id}/owner-view` — everything his view reads, in one shape. */
export function toQuoteOwnerView(view: ApiQuoteOwnerView): QuoteOwnerView {
  return {
    header: {
      id: view.id,
      customerId: view.customer_id,
      houseId: view.house_id,
      level: view.level_label,
      status: view.status,
      title: view.title,
      createdAt: view.created_at,
      sentAt: view.sent_at,
      pricesFrozenAt: view.prices_frozen_at,
      acceptedAt: view.accepted_at,
      declinedAt: view.declined_at,
      agreedTotalPesewas: view.agreed_total_pesewas,
      declinedReason: view.declined_reason,
    },
    money: toQuoteMoney(view.money),
    lines: [...view.lines].sort((a, b) => a.sort_order - b.sort_order).map(toQuoteLine),
  }
}

/** A room of the house, as the chips and the rail list it. */
export const toQuoteRoom = (room: ApiQuoteRoom): QuoteRoom => ({
  id: room.id,
  name: room.name,
  sortOrder: room.sort_order,
})

/**
 * `GET /quotes/{id}/customer-view` → her screen.
 *
 * The three arguments after the payload are the facts her view shows that the
 * customer endpoint does not carry: when the quote was written, whose house it
 * is for, and how many rooms it touches. None is a cost. They are passed in
 * rather than fetched here because this file does not fetch, and passed
 * explicitly rather than taken off the owner view because *nothing* owner-side
 * may reach this function — the type system is the wall, so the wall has to be
 * somewhere a type can stand.
 *
 * `Installation` and `Materials` become rows of the same shape as a need, so her
 * view renders one list. They carry no items: itemising says what the devices
 * are, and labour has no parts.
 */
export function toCustomerQuote(
  view: ApiQuoteCustomerView,
  facts: { createdAt: string; surname: string; roomCount: number },
): CustomerQuote {
  const items = view.items ?? []

  const groups: CustomerGroup[] = view.groups.map((group) => ({
    label: needLabel(group.need),
    totalPesewas: group.total_pesewas,
    items: items
      .filter((item) => item.need === group.need)
      .map((item) => ({
        text: `${item.quantity} × ${item.item_name ?? 'Item'}${item.room_name ? ` · ${item.room_name}` : ''}`,
        totalPesewas: item.line_total_pesewas,
      })),
  }))

  return {
    date: formatLongDate(facts.createdAt),
    surname: facts.surname,
    level: needLabel(view.level_label),
    roomCount: facts.roomCount,
    groups: [
      ...groups,
      { label: 'Installation', totalPesewas: view.labour_charge_pesewas, items: [] },
      { label: 'Materials', totalPesewas: view.materials_charge_pesewas, items: [] },
    ],
    totalPesewas: view.total_pesewas,
  }
}

// --- outbound ---------------------------------------------------------------

/** What a line edit sends. Only the fields named are sent. */
export function toLinePatch(fields: {
  quantity?: number
  need?: string
  note?: string | null
  roomId?: number | null
}): ApiQuoteLineUpdate {
  const patch: ApiQuoteLineUpdate = {}
  if (fields.quantity !== undefined) patch.quantity = fields.quantity
  if (fields.need !== undefined) patch.need = fields.need
  if (fields.note !== undefined) patch.note = fields.note?.trim() || null
  if (fields.roomId !== undefined) patch.room_id = fields.roomId
  return patch
}

/**
 * One entry of the bulk line patch. `removed` becomes `is_removed`, which is
 * how the one call carries a switch-off or a switch-back-on as well as an edit.
 */
export function toLineBulkPatch(
  lineId: number,
  fields: Parameters<typeof toLinePatch>[0] & { removed?: boolean },
): ApiQuoteLineBulkUpdate {
  const patch: ApiQuoteLineBulkUpdate = { id: lineId, ...toLinePatch(fields) }
  if (fields.removed !== undefined) patch.is_removed = fields.removed
  return patch
}

/**
 * The money patch. `null` for a charge is not "zero" — it is "stop holding my
 * figure and derive it again", which is what clearing the box means.
 */
export function toChargesPatch(fields: {
  labourPesewas?: number | null
  materialsPesewas?: number | null
  miscPesewas?: number
}): ApiQuoteChargesUpdate {
  const patch: ApiQuoteChargesUpdate = {}
  if (fields.labourPesewas !== undefined) patch.labour_charge_pesewas = fields.labourPesewas
  if (fields.materialsPesewas !== undefined) {
    patch.materials_charge_pesewas = fields.materialsPesewas
  }
  if (fields.miscPesewas !== undefined) patch.misc_cost_estimate_pesewas = fields.miscPesewas
  return patch
}
