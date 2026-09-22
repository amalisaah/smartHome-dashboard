/**
 * Local stand-in for the groups endpoints, for a screen whose backend does not
 * exist yet. Two halves, and the line between them is the point:
 *
 *   - `MOCK_GROUPS_TABLE` is the eight rows as the reference draws them. Every
 *     figure is transcribed, not computed.
 *   - `projectMarkup` stands in for the preview the API will answer with while
 *     he types. It lives here, in the data layer, so that no pricing arithmetic
 *     sits in the screen: the UI renders the projection it is handed.
 *
 * The derivation reproduces the reference exactly — `switching` at 1.50 → 1.65
 * gives `33% → 39%`, `39 of 44`, and the 2-gang switch at `373.00 → 410.19`.
 *
 * The markups here are the reference frame's, which differ from
 * `catalogueMock`'s on four groups (climate, power, networking, control). The
 * frame is the spec for this screen; reconciling the two would move catalogue
 * prices, which this handoff does not cover.
 *
 * `capitalInStockPesewas` is the one figure the reference frame never drew — it
 * replaced the Overridden column. There is no item list here to sum it from, so
 * unlike the margins it is seeded rather than derived: plausible against each
 * group's item count and its example item's landed cost, and nothing more. It
 * goes when the endpoint can answer it.
 */

import { markupToBps, type MarkupGroup, type MarkupProjection } from '@/types/groups'

/** The one item per group the commit bar names, with both of its prices. */
interface ExampleSeed {
  /** Spoken short form — the sentence reads "the 2-gang switch goes …". */
  itemName: string
  /** Integer pesewas. The projected price is this grown by the draft markup. */
  landedCostPesewas: number
  /** Integer pesewas, as it stands today. */
  sellPricePesewas: number
}

interface GroupSeed extends Omit<MarkupGroup, 'id' | 'avgMarginPercent'> {
  example: ExampleSeed
}

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
    example: { itemName: 'E27 RGB bulb', landedCostPesewas: 5200, sellPricePesewas: 8320 },
  },
  {
    name: 'switching',
    slug: 'switching',
    markupBps: markupToBps('1.50'),
    itemCount: 44,
    capitalInStockPesewas: 6_347_040,
    overriddenCount: 5,
    example: { itemName: '2-gang switch', landedCostPesewas: 24_860, sellPricePesewas: 37_300 },
  },
  {
    name: 'security',
    slug: 'security',
    markupBps: markupToBps('1.60'),
    itemCount: 28,
    capitalInStockPesewas: 4_892_000,
    overriddenCount: 1,
    example: { itemName: '3MP outdoor camera', landedCostPesewas: 41_500, sellPricePesewas: 66_400 },
  },
  {
    name: 'climate',
    slug: 'climate',
    markupBps: markupToBps('1.55'),
    itemCount: 12,
    capitalInStockPesewas: 974_400,
    overriddenCount: 0,
    example: { itemName: 'wall thermostat', landedCostPesewas: 28_000, sellPricePesewas: 43_400 },
  },
  {
    name: 'power',
    slug: 'power',
    markupBps: markupToBps('1.50'),
    itemCount: 19,
    capitalInStockPesewas: 729_600,
    overriddenCount: 2,
    example: { itemName: '16A smart plug', landedCostPesewas: 9800, sellPricePesewas: 14_700 },
  },
  {
    name: 'networking',
    slug: 'networking',
    markupBps: markupToBps('1.45'),
    itemCount: 23,
    capitalInStockPesewas: 2_139_000,
    overriddenCount: 4,
    example: { itemName: 'Zigbee hub', landedCostPesewas: 31_000, sellPricePesewas: 44_950 },
  },
  {
    name: 'sensors',
    slug: 'sensors',
    markupBps: markupToBps('1.65'),
    itemCount: 36,
    capitalInStockPesewas: 1_195_200,
    overriddenCount: 1,
    example: { itemName: 'battery door sensor', landedCostPesewas: 7400, sellPricePesewas: 12_210 },
  },
  {
    name: 'control',
    slug: 'control',
    markupBps: markupToBps('1.55'),
    itemCount: 21,
    capitalInStockPesewas: 834_400,
    overriddenCount: 2,
    example: { itemName: 'round IR blaster', landedCostPesewas: 11_200, sellPricePesewas: 17_360 },
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

/**
 * What a group's rows would become at `markupBps` — the answer the preview
 * endpoint will give. An overridden item keeps the price it was given, so the
 * change reaches the rest.
 */
export function projectMarkup(slug: string, markupBps: number): MarkupProjection | null {
  const seed = SEED_BY_SLUG.get(slug)
  if (!seed) return null

  const markup = 1 + markupBps / 10_000

  return {
    slug,
    markupBps,
    projectedMarginPercent: marginOf(markupBps),
    affectedCount: seed.itemCount - seed.overriddenCount,
    example: {
      itemName: seed.example.itemName,
      oldPricePesewas: seed.example.sellPricePesewas,
      newPricePesewas: Math.round(seed.example.landedCostPesewas * markup),
    },
  }
}
