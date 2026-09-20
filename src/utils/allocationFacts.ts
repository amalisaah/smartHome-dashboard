/**
 * What receiving this shipment will do, counted once.
 *
 * The chips under the preview table and the list in the receive dialog are the
 * same handful of facts said twice, in two registers: the chips count them, the
 * dialog states them as consequences. So they are counted here, from the rows
 * the API allocated, and shaped into words below.
 *
 * Both used to be copy with one shipment's figures written into it — the dialog
 * told every shipment that four landed costs were being rewritten, which was
 * true of the shipment it was drawn from and of no other.
 */

import { movePercent, type ConsequenceLine, type PreviewRow, type ReadoutChip } from '@/types/shipment'
import { formatCount } from '@/utils/format'

export interface AllocationFacts {
  /** Items whose landed cost had a previous figure to move from. */
  rewritten: number
  down: number
  up: number
  /** The steepest rise, whole percent. Null when nothing rose. */
  steepestRisePercent: number | null
  /** Items that have never had a landed cost — there is no was-line to draw. */
  firstCosts: number
  /** Prices the group markup will write. */
  followMarkup: number
  /** Prices he put there by hand, which receiving leaves where they are. */
  overridden: number
  /** Rows with no group: no markup, so no price, so nothing to receive it at. */
  blocked: number
}

/** `1 cost` / `3 costs`. A count of one never reads as a plural. */
const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)

export function allocationFacts(rows: PreviewRow[]): AllocationFacts {
  const facts: AllocationFacts = {
    rewritten: 0,
    down: 0,
    up: 0,
    steepestRisePercent: null,
    firstCosts: 0,
    followMarkup: 0,
    overridden: 0,
    blocked: 0,
  }

  for (const row of rows) {
    const previous = row.previousLandedUnitPesewas

    // No previous cost is a first cost, not a fall to zero — and nothing that
    // has never had a figure can be said to have been rewritten.
    if (previous === null) {
      facts.firstCosts += 1
    } else {
      facts.rewritten += 1
      if (row.landedUnitPesewas < previous) facts.down += 1
      else if (row.landedUnitPesewas > previous) {
        facts.up += 1
        const rise = movePercent(row.landedUnitPesewas, previous)
        if (rise !== null && (facts.steepestRisePercent === null || rise > facts.steepestRisePercent)) {
          facts.steepestRisePercent = rise
        }
      }
    }

    // A price he decided is not a price the markup writes: the two are exclusive.
    if (row.priceOverridden) facts.overridden += 1
    else if (row.sellPricePesewas !== null) facts.followMarkup += 1

    if (row.blocksReceiving) facts.blocked += 1
  }

  return facts
}

/**
 * The chips under the read-out. A fact that did not happen has no chip — an
 * empty count is not worth a `0` the eye has to read past.
 */
export function readoutChips(facts: AllocationFacts): ReadoutChip[] {
  const chips: ReadoutChip[] = []

  if (facts.down) {
    chips.push({ text: `${facts.down} ${plural(facts.down, 'cost', 'costs')} down`, tone: 'neutral' })
  }
  if (facts.up) {
    chips.push({ text: `${facts.up} ${plural(facts.up, 'cost', 'costs')} up`, tone: 'neutral' })
  }
  if (facts.firstCosts) {
    chips.push({
      text: `${facts.firstCosts} first ${plural(facts.firstCosts, 'cost', 'costs')}`,
      tone: 'neutral',
    })
  }
  if (facts.blocked) {
    chips.push({
      text: `${facts.blocked} ${plural(facts.blocked, 'item blocks', 'items block')} receiving`,
      tone: 'warn',
    })
  }
  if (facts.overridden) {
    chips.push({
      text: `${facts.overridden} ${plural(facts.overridden, 'price', 'prices')} overridden — untouched`,
      tone: 'action',
    })
  }

  return chips
}

/**
 * The receive dialog's list: what the irreversible act is about to do, as counts,
 * in his words. The units line leads because it is the one he came for.
 */
export function receiveConsequences(
  facts: AllocationFacts,
  unitCount: number,
  lineCount: number,
): ConsequenceLine[] {
  const lines: ConsequenceLine[] = [
    {
      figure: `+${formatCount(unitCount)}`,
      tone: 'action',
      text: `units enter stock across ${formatCount(lineCount)} ${plural(lineCount, 'item', 'items')}`,
    },
  ]

  if (facts.rewritten) {
    // A cost that landed on the same figure is rewritten and has not moved: it
    // is in the count and in neither direction.
    const moves: string[] = []
    if (facts.down) moves.push(`${facts.down} down`)
    if (facts.up) {
      const steepest = facts.steepestRisePercent
      if (steepest === null) moves.push(`${facts.up} up`)
      else moves.push(facts.up === 1 ? `1 up ${steepest}%` : `${facts.up} up, steepest ${steepest}%`)
    }

    const tail = moves.length ? ` — ${moves.join(', ')}` : ''
    lines.push({
      figure: formatCount(facts.rewritten),
      tone: 'neutral',
      text: `landed ${plural(facts.rewritten, 'cost is', 'costs are')} rewritten${tail}`,
    })
  }

  if (facts.firstCosts) {
    lines.push({
      figure: formatCount(facts.firstCosts),
      tone: 'neutral',
      text: `${plural(facts.firstCosts, 'item gets its', 'items get their')} first landed cost`,
    })
  }

  if (facts.followMarkup) {
    lines.push({
      figure: formatCount(facts.followMarkup),
      tone: 'neutral',
      text: `selling ${plural(facts.followMarkup, 'price follows', 'prices follow')} the group markup automatically`,
    })
  }

  if (facts.overridden) {
    lines.push({
      figure: formatCount(facts.overridden),
      tone: 'warn',
      text: `overridden ${plural(facts.overridden, 'price stays where you put it', 'prices stay where you put them')}`,
    })
  }

  return lines
}
