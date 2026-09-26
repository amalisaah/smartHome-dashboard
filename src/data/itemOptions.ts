import type { ItemUnitOption } from '@/types/item'

/**
 * Fixed vocabularies the item screen offers. Not mock data — the API has no
 * endpoint for either, and `unit` is a free string on the item, so these are the
 * app's own list rather than a stand-in for one the backend will serve.
 */

export const ITEM_UNITS: ItemUnitOption[] = [
  { value: 'piece', label: 'piece' },
  { value: 'metre', label: 'metre' },
  { value: 'roll', label: 'roll' },
]

/** What the Adjust-count sheet offers before he has to write a reason himself. */
export const ADJUST_REASONS = [
  'Damaged on site',
  'Lost — unaccounted for',
  'Count corrected after stock check',
  'Used on a job',
  'Returned to supplier',
]

/** The option that reveals the free-text field. */
export const OTHER_REASON = 'Something else…'
