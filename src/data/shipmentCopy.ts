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

import type { AllocationBasis, ReadoutSentence } from '@/types/shipment'

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

/**
 * What each allocation basis means, in one line, under the control. The three
 * are the wire's three: value, unit, and him.
 */
export const BASIS_NOTES: Record<AllocationBasis, string> = {
  'by-value': 'Each item carries freight in proportion to its share of product value.',
  'per-unit': 'Every unit carries the same freight, whatever the unit cost.',
  override: 'You decide what each line carries, instead of a rule deciding it.',
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

/** Under the panel while a rule is still doing the splitting. */
export const OVERRIDE_NOTE =
  'Available, never the default. Leaving this alone is always a defensible answer; choosing it hands you every line to set by hand, and records that you decided the split.'

/**
 * The read-out's sentence under the preview table.
 *
 * **Still a sample** — the last one on this screen. The chips beneath it are
 * this shipment's own, counted in `allocationFacts`, and the split panel beside
 * it now totals the lines he set. But nothing on the API writes a *sentence*
 * about a shipment, so this one still names the bulbs and the cameras of the
 * shipment it was drawn from.
 */
export const PREVIEW_COPY: { sentence: ReadoutSentence } = {
  sentence: {
    lead: 'The bulbs got cheaper per unit because you bought forty of them; ',
    emphasis: 'the cameras carry GH₵ 76 of freight each',
    tail:
      ' and now cost more than they sell for at the old price. Selling prices below follow automatically — the two overridden items do not.',
  },
}

/** Under the consequence list, which `allocationFacts` counts for itself. */
export const RECEIVE_NOTE =
  "Every change is recorded as a movement. If a unit arrives damaged, adjust the count afterwards — don't unreceive the shipment."
