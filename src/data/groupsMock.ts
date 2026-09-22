/**
 * Local stand-in for the groups endpoints, for a screen whose backend does not
 * exist yet. Two halves, and the line between them is the point:
 *
 *   - `MOCK_GROUPS_TABLE` is the eight rows as the reference draws them. Every
 *     figure is transcribed, not computed.
 *   - `projectMarkup` says how far a change would reach. It lives here, in the
 *     data layer, so that no pricing arithmetic sits in the screen: the UI
 *     renders what it is handed.
 *
 * `switching` at 1.50 → 1.65 gives `39 of 44`, as the reference draws it.
 *
 * The markups here are the reference frame's, which differ from
 * `catalogueMock`'s on four groups (climate, power, networking, control). The
 * frame is the spec for this screen; reconciling the two would move catalogue
 * prices, which this handoff does not cover.
 *
 * `capitalInStockPesewas` is the one figure the reference frame never drew — it
 * replaced the Overridden column. There is no item list here to sum it from, so
 * unlike the margins it is seeded rather than derived: plausible against each
 * group's item count, and nothing more. It goes when the endpoint answers it —
 * `GET /groups/details` does now.
 */

import { markupToBps, type MarkupGroup, type MarkupProjection } from '@/types/groups'

type GroupSeed = Omit<MarkupGroup, 'id' | 'avgMarginPercent'>

/**
 * Margin as a whole percent, the way the frame rounds it: 1.50 → 33%, 1.65 →
 * 39%, 1.45 → 31%. A markup at or below 1 has no margin worth stating.
 */
const marginOf = (markupBps: number) => {
  const markup = 1 + markupBps / 10_000
  return markup <= 0 ? 0 : Math.floor(100 * (1 - 1 / markup))
}

const SEEDS: GroupSeed[] = [
  {
    name: 'lighting',
    slug: 'lighting',
    markupBps: markupToBps('1.60'),
    itemCount: 31,
    capitalInStockPesewas: 1_420_800,
    overriddenCount: 3,
  },
  {
    name: 'switching',
    slug: 'switching',
    markupBps: markupToBps('1.50'),
    itemCount: 44,
    capitalInStockPesewas: 6_347_040,
    overriddenCount: 5,
  },
  {
    name: 'security',
    slug: 'security',
    markupBps: markupToBps('1.60'),
    itemCount: 28,
    capitalInStockPesewas: 4_892_000,
    overriddenCount: 1,
  },
  {
    name: 'climate',
    slug: 'climate',
    markupBps: markupToBps('1.55'),
    itemCount: 12,
    capitalInStockPesewas: 974_400,
    overriddenCount: 0,
  },
  {
    name: 'power',
    slug: 'power',
    markupBps: markupToBps('1.50'),
    itemCount: 19,
    capitalInStockPesewas: 729_600,
    overriddenCount: 2,
  },
  {
    name: 'networking',
    slug: 'networking',
    markupBps: markupToBps('1.45'),
    itemCount: 23,
    capitalInStockPesewas: 2_139_000,
    overriddenCount: 4,
  },
  {
    name: 'sensors',
    slug: 'sensors',
    markupBps: markupToBps('1.65'),
    itemCount: 36,
    capitalInStockPesewas: 1_195_200,
    overriddenCount: 1,
  },
  {
    name: 'control',
    slug: 'control',
    markupBps: markupToBps('1.55'),
    itemCount: 21,
    capitalInStockPesewas: 834_400,
    overriddenCount: 2,
  },
]

export const MOCK_GROUPS_TABLE: MarkupGroup[] = SEEDS.map((seed, index) => ({
  id: index + 1,
  name: seed.name,
  slug: seed.slug,
  markupBps: seed.markupBps,
  itemCount: seed.itemCount,
  avgMarginPercent: marginOf(seed.markupBps),
  capitalInStockPesewas: seed.capitalInStockPesewas,
  overriddenCount: seed.overriddenCount,
}))

const SEED_BY_SLUG = new Map(SEEDS.map((seed) => [seed.slug, seed]))

/** Stands in for the sequence behind the groups table. */
let lastId = MOCK_GROUPS_TABLE.length

/** `Smoke & gas` → `smoke-gas`. What the API will mint from the name. */
export const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Stands in for `POST /groups`. A group made here starts empty: no items, so
 * no capital standing on it and nothing overridden. Its margin follows from
 * the markup it was given, the same as every other row's.
 *
 * It is registered as a seed so that `projectMarkup` can answer for it the
 * moment he edits its markup in the table — a group the preview cannot answer
 * for would be a row that silently refuses to change.
 */
export function createGroup(name: string, markupBps: number): MarkupGroup {
  const slug = slugify(name)
  const seed: GroupSeed = {
    name,
    slug,
    markupBps,
    itemCount: 0,
    capitalInStockPesewas: 0,
    overriddenCount: 0,
  }

  // The table reseeds from `MOCK_GROUPS_TABLE` on every mount, so a group made
  // in a previous visit can be made again. It replaces its seed rather than
  // leaving a second one behind.
  const existing = SEEDS.findIndex((candidate) => candidate.slug === slug)
  if (existing === -1) SEEDS.push(seed)
  else SEEDS[existing] = seed
  SEED_BY_SLUG.set(slug, seed)

  return {
    id: ++lastId,
    name,
    slug,
    markupBps,
    itemCount: 0,
    avgMarginPercent: marginOf(markupBps),
    capitalInStockPesewas: 0,
    overriddenCount: 0,
  }
}

/**
 * The margin the group reports once a markup has actually been saved — the
 * mock standing in for the figure `GET /groups/details` answers with on the
 * refetch after the write. It is not a projection: the screen never shows this
 * before the press.
 */
export const settledMargin = (markupBps: number) => marginOf(markupBps)

/**
 * How far a change at `markupBps` would reach. An overridden item keeps the
 * price it was given, so the change reaches the rest.
 *
 * No projected margin and no worked example: the first needs the split between
 * the items the markup prices and the ones pricing themselves, the second
 * needs an item — and no group-level figure carries either. The row's Avg
 * margin holds still and the bar states the consequence in counts instead.
 */
export function projectMarkup(slug: string, markupBps: number): MarkupProjection | null {
  const seed = SEED_BY_SLUG.get(slug)
  if (!seed) return null

  return {
    slug,
    markupBps,
    affectedCount: seed.itemCount - seed.overriddenCount,
  }
}
