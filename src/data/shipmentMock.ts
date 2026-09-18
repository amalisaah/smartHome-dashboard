/**
 * Sample data for the shipment builder, shaped as the view model in
 * `@/types/shipment` rather than as a wire contract: `openapi.json` has nothing
 * to say about shipments yet, so there is no snake_case layer to mirror.
 *
 * Every figure here is the reference frame's own. Two notes on what that means:
 *
 *   - The frames were drawn as separate samples and do not reconcile with each
 *     other. C4 lists `3 down, 1 up` and `2 overridden` where C2's four rows are
 *     2 down, 1 up, 1 first cost and none overridden; C1's header says 14 lines
 *     over a table of 4. Counts the screen can see for itself are derived, so
 *     the header reads `4 lines`; prose and figures are rendered as given.
 *   - The catalogue the inline-create row searches is the real catalogue mock,
 *     so its hint counts 210 items rather than the frame's 214.
 */

import type {
  AllocationPreview,
  InvoiceLine,
  ShipmentListRow,
  ShipmentMeta,
  SharedCost,
} from '@/types/shipment'

/**
 * How far a landed cost has to move before its preview row is marked. Where
 * that line sits is a product decision — this is the one place it is stated,
 * and it travels to the table as a prop.
 */
export const MOVED_ENOUGH_THRESHOLD_PERCENT = 10

export const INVOICE_CURRENCIES = ['USD', 'CNY', 'GH₵']

export const DRAFT_META: ShipmentMeta = {
  ref: 'SH-015',
  state: 'draft',
  supplier: 'Shenzhen Hongsen',
  orderDate: '03 Sep 2026',
  invoiceCurrency: 'USD',
  rate: '12.40',
  expectedArrival: '24 Sep 2026',
  receivedAt: null,
  splitOverridden: false,
}

/**
 * A shipment that does not exist yet: nothing is known about it but the ref he
 * will call it by. Every field is his to type, including the rate — there is no
 * sensible default for a rate he has not been to the forex shop for.
 */
export function blankDraftMeta(ref: string): ShipmentMeta {
  return {
    ref,
    state: 'draft',
    supplier: '',
    orderDate: '',
    invoiceCurrency: 'USD',
    rate: '',
    expectedArrival: '',
    receivedAt: null,
    splitOverridden: false,
  }
}

export const DRAFT_LINES: InvoiceLine[] = [
  { id: 1, itemName: 'Tuya no-neutral switch, 2 gang', isNew: false, qty: '20', unitPrice: '14.20' },
  { id: 2, itemName: 'RGB bulb, E27, 9W', isNew: false, qty: '40', unitPrice: '3.10' },
  { id: 3, itemName: 'CCTV camera, 3MP, outdoor', isNew: false, qty: '6', unitPrice: '28.50' },
  { id: 4, itemName: 'Zigbee gateway, v3', isNew: true, qty: '4', unitPrice: '19.80' },
]

export const DRAFT_COSTS: SharedCost[] = [
  { id: 1, label: 'Freight, sea', amount: '1,240.00' },
  { id: 2, label: 'Transfer charge', amount: '96.00' },
  { id: 3, label: 'Duty & clearing', amount: '1,410.00' },
  { id: 4, label: 'Transport, Tema → Accra', amount: '320.00' },
  { id: 5, label: 'Taxi home', amount: '60.00' },
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
 * One preview sample, served for whichever shipment is being looked at. The
 * figures are the frame's; a second sample per shipment would say nothing new
 * about the UI.
 */
export const MOCK_PREVIEW: AllocationPreview = {
  rows: [
    {
      id: 1,
      itemName: 'Tuya no-neutral switch, 2 gang',
      isNew: false,
      group: 'switching',
      markupBps: 5000,
      qty: 20,
      productPesewas: 352160,
      sharePercent: 43.1,
      sharedAddedPesewas: 134850,
      landedUnitPesewas: 24351,
      previousLandedUnitPesewas: 24860,
      sellPricePesewas: 36527,
      previousSellPricePesewas: 37300,
      marginPercent: 33,
      blocksReceiving: false,
      priceOverridden: false,
    },
    {
      id: 2,
      itemName: 'RGB bulb, E27, 9W',
      isNew: false,
      group: 'lighting',
      markupBps: 6000,
      qty: 40,
      productPesewas: 153760,
      sharePercent: 18.8,
      sharedAddedPesewas: 58869,
      landedUnitPesewas: 5316,
      previousLandedUnitPesewas: 6240,
      sellPricePesewas: 8506,
      previousSellPricePesewas: 9900,
      marginPercent: 37,
      blocksReceiving: false,
      priceOverridden: false,
    },
    {
      id: 3,
      itemName: 'CCTV camera, 3MP, outdoor',
      isNew: false,
      group: 'security',
      markupBps: 6000,
      qty: 6,
      productPesewas: 212040,
      sharePercent: 26.0,
      sharedAddedPesewas: 81268,
      landedUnitPesewas: 48885,
      previousLandedUnitPesewas: 41280,
      sellPricePesewas: 78216,
      previousSellPricePesewas: 66000,
      marginPercent: 37,
      blocksReceiving: false,
      priceOverridden: false,
    },
    {
      id: 4,
      itemName: 'Zigbee gateway, v3',
      isNew: true,
      group: null,
      markupBps: null,
      qty: 4,
      productPesewas: 98208,
      sharePercent: 12.0,
      sharedAddedPesewas: 37613,
      landedUnitPesewas: 33955,
      previousLandedUnitPesewas: null,
      sellPricePesewas: null,
      previousSellPricePesewas: null,
      marginPercent: null,
      blocksReceiving: true,
      priceOverridden: false,
    },
  ],
  sentence: {
    lead: 'The bulbs got cheaper per unit because you bought forty of them; ',
    emphasis: 'the cameras carry GH₵ 76 of freight each',
    tail:
      ' and now cost more than they sell for at the old price. Selling prices below follow automatically — the two overridden items do not.',
  },
  chips: [
    { text: '3 costs down', tone: 'neutral' },
    { text: '1 cost up', tone: 'neutral' },
    { text: '1 item blocks receiving', tone: 'warn' },
    { text: '2 prices overridden — untouched', tone: 'action' },
  ],
  overrides: [{ reason: 'Cameras — bulky, took the container', percent: '40' }],
  remainder: '60%',
}

/** What each allocation basis means, in one line, under the control. */
export const BASIS_NOTES: Record<string, string> = {
  'by-value': 'Each item carries freight in proportion to its share of product value.',
  override: 'You decide what a named cost carries; everything else follows value.',
}

export const OVERRIDE_NOTE =
  'Available, never the default. Leaving this alone is always a defensible answer; touching it records who decided the split and when.'

/**
 * The receive dialog's consequence list, in his words. Only the first line is
 * derived — the units and items come from the lines he entered; the rest is the
 * frame's copy, and reads as the sample it is.
 */
export const RECEIVE_CONSEQUENCES = [
  { figure: '4', tone: 'neutral' as const, text: 'landed costs are rewritten — 3 down, 1 up 18%' },
  { figure: '2', tone: 'neutral' as const, text: 'selling prices follow the group markup automatically' },
  { figure: '2', tone: 'warn' as const, text: 'overridden prices stay where you put them' },
]

export const RECEIVE_NOTE =
  "Every change is recorded as a movement. If a unit arrives damaged, adjust the count afterwards — don't unreceive the shipment."

export const MOCK_SHIPMENTS: ShipmentListRow[] = [
  {
    ref: 'SH-015',
    supplier: 'Shenzhen Hongsen',
    units: 70,
    productPesewas: 816168,
    sharedPesewas: 312600,
    state: 'draft',
    stateDate: '2026-09-24',
    splitOverridden: false,
  },
  {
    ref: 'SH-014',
    supplier: 'Shenzhen Hongsen',
    units: 96,
    productPesewas: 994020,
    sharedPesewas: 348000,
    state: 'received',
    stateDate: '2026-08-12',
    splitOverridden: false,
  },
  {
    ref: 'SH-013',
    supplier: 'Guangzhou Yilai',
    units: 48,
    productPesewas: 421000,
    sharedPesewas: 190500,
    state: 'received',
    stateDate: '2026-06-04',
    splitOverridden: true,
  },
]

/** The meta a received shipment opens its read-only preview with. */
export function metaForShipment(ref: string): ShipmentMeta {
  if (ref === DRAFT_META.ref) return { ...DRAFT_META }

  const row = MOCK_SHIPMENTS.find((shipment) => shipment.ref === ref)
  return {
    ref,
    state: row?.state ?? 'draft',
    supplier: row?.supplier ?? '',
    orderDate: '',
    invoiceCurrency: 'USD',
    rate: '12.40',
    expectedArrival: '',
    receivedAt: row?.state === 'received' ? (row?.stateDate ?? null) : null,
    splitOverridden: row?.splitOverridden ?? false,
  }
}
