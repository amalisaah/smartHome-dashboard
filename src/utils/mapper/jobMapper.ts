/**
 * `GET /jobs/{id}/detail` → block C's view model.
 *
 * **What this file computes, and why.** The handoff calls every figure on the
 * screen supplied, and almost all of them are: profit, the costs, the owed
 * balance and the variance against the quote all arrive whole. Three things do
 * not, and they are counts rather than money — how many lines differ, how many
 * went in as quoted, and how many devices the job will draw from stock. No
 * endpoint offers any of them, and they have to agree with the rows actually on
 * screen, so they are counted here off the same rows the table renders.
 *
 * The one piece of arithmetic is `changeFor`, which reads a line's frozen
 * `quoted_*` fields the way the server does. It exists locally because a Fitted
 * figure he has just typed has to show its chip before the PATCH lands — the
 * alternative is a chip that appears a beat after the number it describes.
 */

import type {
  ApiJobCost,
  ApiJobDetail,
  ApiJobLine,
  ApiJobPayment,
  ApiJobSummary,
} from '@/types/jobApi'
import type {
  JobChange,
  JobCostRow,
  JobLineRow,
  JobMoney,
  JobPaymentRow,
  JobRecord,
  JobRoomGroup,
} from '@/types/job'
import { formatCurrency, formatShortDate } from '@/utils/format'

/** `98` → `0098`. The same reduction the quote list makes on a quote. */
export const jobNumber = (id: number) => String(id).padStart(4, '0')

/**
 * Lines with no room of their own — whole-house equipment. It still needs a
 * group header, because the table groups by room and a row with no header
 * would read as belonging to the room above it.
 */
const WHOLE_HOUSE = 'whole house'

/**
 * `Ama Adjei` → `Adjei`. A job is addressed to the household, and the household
 * is the family name — the same reduction the quote list and the quote builder
 * both make. An anonymised customer's placeholder has no family name in it, so
 * it stands whole rather than being cut to its last word.
 */
function surnameOf(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Unnamed'
  if (trimmed.startsWith('Customer #')) return trimmed
  return trimmed.split(/\s+/).pop() as string
}

/**
 * What the day did to this line.
 *
 * The order is the order of severity, not of likelihood: a line that came back
 * at nothing is the one he has to look at, whatever else is also true of it.
 * `added` next, because a line the quote never had has no delta to report. Then
 * the swap, which is about the item rather than the count. A plain delta is
 * last, and a line matching its quote has no chip at all — which is the whole
 * point of the Differences view.
 */
export function changeFor(line: {
  quantity: number
  quoted_quantity: number | null
  is_substitution: boolean
}): JobChange | null {
  if (line.quoted_quantity === null) return { kind: 'added', label: 'added' }
  if (line.quantity === 0) return { kind: 'missing', label: 'not fitted' }
  if (line.is_substitution) return { kind: 'swapped', label: 'swapped' }

  const delta = line.quantity - line.quoted_quantity
  if (delta === 0) return null
  // The typographic minus, not a hyphen: these sit in mono beside `+2`, and a
  // hyphen reads a third of the width.
  return { kind: 'delta', label: `${delta > 0 ? '+' : '−'}${Math.abs(delta)}` }
}

function toLineRow(line: ApiJobLine): JobLineRow {
  return {
    id: line.id,
    room: line.room?.name?.trim() || WHOLE_HOUSE,
    itemName: line.item_name?.trim() || `Item #${line.item_id}`,
    quotedItemName: line.quoted_item_name?.trim() || null,
    need: line.need,
    quotedQuantity: line.quoted_quantity,
    fitted: line.quantity,
    change: changeFor(line),
    chargedPesewas: line.line_selling_total_pesewas,
    costPesewas: line.line_cost_pesewas,
    note: line.note?.trim() ?? '',
    unitSellingPricePesewas: line.unit_selling_price_pesewas,
    unitLandedCostPesewas: line.unit_landed_cost_pesewas,
  }
}

/**
 * Rows under the room they went in.
 *
 * Grouped by first appearance rather than by a room list, because the job's
 * lines carry their room as a snapshot and the house's rooms may since have
 * been renamed. `sort_order` is what the job says the order is, so it is
 * honoured before anything is grouped.
 */
export function groupByRoom(rows: JobLineRow[]): JobRoomGroup[] {
  const groups: JobRoomGroup[] = []
  const byRoom = new Map<string, JobRoomGroup>()

  for (const row of rows) {
    let group = byRoom.get(row.room)
    if (!group) {
      group = { room: row.room, rows: [] }
      byRoom.set(row.room, group)
      groups.push(group)
    }
    group.rows.push(row)
  }

  return groups
}

const toPaymentRow = (payment: ApiJobPayment): JobPaymentRow => ({
  id: payment.id,
  paidOn: formatShortDate(payment.paid_at),
  method: payment.method,
  reference: payment.reference?.trim() || null,
  amountPesewas: payment.amount_pesewas,
})

const toCostRow = (cost: ApiJobCost): JobCostRow => ({
  id: cost.id,
  label: cost.label,
  source: cost.source,
  hasReceipt: cost.receipt_url !== null,
  amountPesewas: cost.amount_pesewas,
})

/** The money, moved across unchanged. Not one figure here is worked out. */
export const toMoney = (summary: ApiJobSummary): JobMoney => ({
  profitPesewas: summary.profit_pesewas,
  chargedPesewas: summary.agreed_total_pesewas,
  costTotalPesewas: summary.cost_total_pesewas,
  deviceCostPesewas: summary.device_cost_pesewas,
  miscActualPesewas: summary.misc_cost_actual_pesewas,
  miscEstimatePesewas: summary.misc_cost_estimate_snapshot_pesewas,
  miscDeltaPesewas: summary.variance.misc_delta_pesewas,
  receivedPesewas: summary.received_pesewas,
  owedPesewas: summary.owed_pesewas,
  balanceState: summary.balance_state,
  expectedProfitPesewas: summary.variance.expected_profit_pesewas,
  profitVariancePesewas: summary.variance.profit_variance_pesewas,
})

/**
 * `From quote 0142 · accepted 2 Oct at GH₵ 7,500`, assembled from the slice of
 * the quote the detail read carries.
 *
 * The figure is the **quote's** agreed total rather than the job's. They start
 * equal, and once he moves the job's the header must still say what she agreed
 * to — otherwise the one line recording the original silently becomes a copy of
 * the field he just edited.
 */
function acceptedLineFor(quote: ApiJobDetail['quote']): string | null {
  if (quote === null) return null

  const when = quote.accepted_at === null ? null : formatShortDate(quote.accepted_at)
  const figure =
    quote.agreed_total_pesewas === null ? null : formatCurrency(quote.agreed_total_pesewas)

  if (when !== null && figure !== null) return `accepted ${when} at ${figure}`
  if (when !== null) return `accepted ${when}`
  if (figure !== null) return `agreed at ${figure}`
  return null
}

export function toJobRecord(detail: ApiJobDetail): JobRecord {
  const rows = [...detail.lines]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(toLineRow)

  // The label omits the house when there is none to name rather than printing a
  // placeholder: `Job 0098 — Adjei` is a true header, `Adjei, —` is not.
  const surname = surnameOf(detail.customer_name)
  const area = detail.house_label?.trim()

  return {
    id: detail.id,
    number: jobNumber(detail.id),
    household: area ? `${surname}, ${area}` : surname,
    quoteNumber: detail.quote?.id != null ? jobNumber(detail.quote.id) : null,
    quoteId: detail.quote?.id ?? null,
    acceptedLine: acceptedLineFor(detail.quote),
    status: detail.status,
    jobType: detail.job_type,
    quoteAgreedPesewas: detail.quote?.agreed_total_pesewas ?? null,
    groups: groupByRoom(rows),
    // Oldest first: a deposit then the balance is the order he took them in.
    payments: [...detail.payments]
      .sort((a, b) => Date.parse(a.paid_at) - Date.parse(b.paid_at))
      .map(toPaymentRow),
    costs: detail.costs.map(toCostRow),
    money: toMoney(detail.summary),
  }
}
