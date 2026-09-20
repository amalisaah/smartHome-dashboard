/**
 * The words on the shipment screens that the API has nothing to say about, and
 * the one product constant behind a rule.
 *
 * Everything that *is* data now comes from the backend: the list from
 * `GET /shipments`, the draft from `GET /shipments/{id}`, the allocation from
 * `GET /shipments/{id}/preview`. What stays here is prose — a note under a
 * control, the sentence the preview reads its own figures out with — and it is
 * marked where it is still a sample rather than a claim about this shipment.
 */

import type { OverrideRow, ReadoutSentence } from '@/types/shipment'

/**
 * How far a landed cost has to move before its preview row is marked. Where
 * that line sits is a product decision — this is the one place it is stated,
 * and it travels to the table as a prop.
 */
export const MOVED_ENOUGH_THRESHOLD_PERCENT = 10

/**
 * The currencies a supplier invoices in. The value is the wire's own enum; the
 * label is how he writes it — `GHS` is `GH₵` on paper and in every figure here.
 */
export const INVOICE_CURRENCIES: { value: string; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'CNY', label: 'CNY' },
  { value: 'GHS', label: 'GH₵' },
]

/**
 * The line that follows the shipment total. The percentage in it is derived, so
 * the sentence bolds a figure that cannot disagree with the block above it.
 */
export const SHARED_COST_NOTE = {
  lead: 'Shared costs are ',
  tail: ' of the product value on this shipment. That is what makes the Alibaba price a lie.',
}

/** What each allocation basis means, in one line, under the control. */
export const BASIS_NOTES: Record<string, string> = {
  'by-value': 'Each item carries freight in proportion to its share of product value.',
  override: 'You decide what a named cost carries; everything else follows value.',
}

/**
 * The notes field at the foot of the builder. The placeholder is the teaching:
 * it shows the kind of fact that has nowhere else to live on this screen, so the
 * field does not read as a box for repeating what the figures already say.
 */
export const NOTES_COPY = {
  hint: 'what the figures don’t say',
  placeholder: 'Shorted 3 units — credit promised on the next order. Duty paid cash at the port.',
}

export const OVERRIDE_NOTE =
  'Available, never the default. Leaving this alone is always a defensible answer; touching it records who decided the split and when.'

/**
 * The read-out's sentence under the preview table, and the split panel beside it.
 *
 * **Still a sample.** The chips beneath the sentence are this shipment's own —
 * counted in `allocationFacts` — but nothing on the API writes a *sentence*
 * about them, and the override panel has no endpoint to send a hand-decided
 * split to: `allocation_method: manual` says only that one was decided. These
 * two are the frame's copy until that exists.
 */
export const PREVIEW_COPY: {
  sentence: ReadoutSentence
  overrides: OverrideRow[]
  remainder: string
} = {
  sentence: {
    lead: 'The bulbs got cheaper per unit because you bought forty of them; ',
    emphasis: 'the cameras carry GH₵ 76 of freight each',
    tail:
      ' and now cost more than they sell for at the old price. Selling prices below follow automatically — the two overridden items do not.',
  },
  overrides: [{ reason: 'Cameras — bulky, took the container', percent: '40' }],
  remainder: '60%',
}

/** Under the consequence list, which `allocationFacts` counts for itself. */
export const RECEIVE_NOTE =
  "Every change is recorded as a movement. If a unit arrives damaged, adjust the count afterwards — don't unreceive the shipment."
