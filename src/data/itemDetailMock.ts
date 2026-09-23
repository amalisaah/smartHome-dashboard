import type { ItemDetail, ItemGroupRef, ItemUnitOption, Movement } from '@/types/item'

/**
 * The item-detail screen's stand-in data.
 *
 * Unlike `catalogueMock`, which derives its figures from the spec's rules, this
 * one transcribes the reference frames: the handoff says "every figure in the
 * reference is sample data; render what you're given, don't compute it", and the
 * screen's job is to show which figures he types and which the system decided —
 * not to be the thing that decides them. So `248.60`, `12`, `33%`, `373.00` and
 * the four movements are exactly the frames' numbers, and no line here does
 * arithmetic on any of them.
 *
 * Cost, price and stock logic all live behind this file, on the day it is
 * replaced by the endpoints.
 */

/** The eight groups, matching the catalogue's own vocabulary. */
export const MOCK_ITEM_GROUPS: ItemGroupRef[] = [
  { id: 1, name: 'lighting' },
  { id: 2, name: 'switching' },
  { id: 3, name: 'security' },
  { id: 4, name: 'climate' },
  { id: 5, name: 'power' },
  { id: 6, name: 'networking' },
  { id: 7, name: 'sensors' },
  { id: 8, name: 'control' },
]

export const MOCK_ITEM_UNITS: ItemUnitOption[] = [
  { value: 'piece', label: 'piece' },
  { value: 'metre', label: 'metre' },
  { value: 'roll', label: 'roll' },
]

const MOCK_MOVEMENTS: Movement[] = [
  {
    id: 1,
    date: '12 Aug',
    description: 'Shipment SH-014 received',
    shortDescription: 'Shipment SH-014',
    delta: 20,
    balance: 20,
    kind: 'in',
    linked: true,
  },
  {
    id: 2,
    date: '19 Aug',
    description: 'Job JB-031 — Adjei residence',
    shortDescription: 'Job JB-031',
    delta: -6,
    balance: 14,
    kind: 'out',
    linked: true,
  },
  {
    id: 3,
    date: '28 Aug',
    description: 'Damaged on site — written off',
    shortDescription: 'Damaged on site',
    delta: -1,
    balance: 13,
    kind: 'loss',
  },
  {
    id: 4,
    date: '2 Sep',
    description: 'Count corrected after stock check',
    shortDescription: 'Count corrected',
    delta: -1,
    balance: 12,
    kind: 'out',
  },
]

/**
 * The reasons the Adjust-count sheet offers before he has to write one. The
 * sheet's free-text entry is the last option; a reason is required either way,
 * because a movement without one is the thing this screen exists to prevent.
 */
export const ADJUST_REASONS = [
  'Damaged on site',
  'Lost — unaccounted for',
  'Count corrected after stock check',
  'Used on a job',
  'Returned to supplier',
]

/** The label that reveals the free-text field. */
export const OTHER_REASON = 'Something else…'

/**
 * A fixed instant two minutes before the screen's `savedAt`, so the header opens
 * on the reference's `Saved 2 minutes ago` rather than on whatever the clock
 * says when the page loads.
 */
const SAVED_AT = new Date(Date.now() - 2 * 60_000).toISOString()

export const MOCK_ITEM: ItemDetail = {
  id: 42,
  draft: {
    name: 'Tuya no-neutral switch, 2 gang',
    groupId: 2,
    keywords: ['tuya', 'no-neutral', 'zigbee'],
    supplier: 'Shenzhen Hongsen',
    supplierLink: 'alibaba.com/product/…',
    supplierContact: '+86 138 0000 0000',
    leadDays: '14',
    reorderLevel: '6',
    unit: 'piece',
    notes:
      'Needs the capacitor for LED loads under 5W — comes in the box. Works with the Smart Life app.',
    photoUrl: null,
  },
  derived: {
    landedCost: { label: 'Landed cost', figure: '248.60', source: 'weighted, 2 shipments' },
    stockOnHand: { label: 'Stock on hand', figure: '12', source: 'reorder at 6' },
    margin: { label: 'Margin', figure: '33%', source: '124.40 per unit' },
    price: {
      derivedPesewas: 37_300,
      markup: '1.50',
      groupName: 'switching',
      overridePesewas: null,
      state: 'derived',
    },
    movements: MOCK_MOVEMENTS,
  },
  groups: MOCK_ITEM_GROUPS,
  units: MOCK_ITEM_UNITS,
  savedAt: SAVED_AT,
}

/**
 * One item stands in for all of them. Every catalogue row opens onto the
 * reference's figures, because the handoff's instruction is to show those
 * figures exactly; the id is carried through so the routes are real.
 */
export const mockItem = (id: number): ItemDetail => ({ ...MOCK_ITEM, id })
