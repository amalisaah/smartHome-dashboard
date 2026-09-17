import type { ApiGroup, ApiItem, ApiSummary } from '@/types/api'

/**
 * Local stand-in for the API, shaped exactly as `openapi.json` says the backend
 * will answer: snake_case, integer pesewas, ISO timestamps, embedded group.
 *
 * The derived fields — `selling_price_pesewas`, `needs_attention`,
 * `ready_to_archive`, and every number in the summary — are computed here from
 * the spec's own stated rules rather than hand-written, so the mock cannot
 * contradict itself the way the real API promises it cannot.
 *
 * Two consequences of deriving rather than transcribing, both intended:
 *   - Selling prices land within a cedi or two of the reference frames. A price
 *     is landed cost grown by the group markup; the frame numbers were drawn
 *     before that rule existed, so they are approached, not reproduced.
 *   - Five rows are low stock, not the four in the frames. `Door sensor` sits at
 *     0 with no reorder level and is not discontinued, and the API counts that
 *     as low — you have none of it and nobody has said to stop stocking it.
 */

const TOTAL_ITEMS = 210

/** One fixed instant, so every timestamp in the mock is stable across reloads. */
const EPOCH = Date.parse('2026-01-06T09:00:00Z')
const DAY_MS = 86_400_000
const isoAt = (daysAgo: number) => new Date(EPOCH + daysAgo * DAY_MS).toISOString()

// --- groups ----------------------------------------------------------------

interface GroupSeed {
  name: string
  slug: string
  /** Basis points — 6000 = 60%. Chosen to land near the frames' selling prices. */
  markupBps: number
}

const GROUP_SEEDS: GroupSeed[] = [
  { name: 'lighting', slug: 'lighting', markupBps: 6000 },
  { name: 'switching', slug: 'switching', markupBps: 5000 },
  { name: 'security', slug: 'security', markupBps: 6000 },
  { name: 'climate', slug: 'climate', markupBps: 6000 },
  { name: 'power', slug: 'power', markupBps: 6000 },
  { name: 'networking', slug: 'networking', markupBps: 5500 },
  { name: 'sensors', slug: 'sensors', markupBps: 6500 },
  { name: 'control', slug: 'control', markupBps: 6500 },
]

export const MOCK_GROUPS: ApiGroup[] = GROUP_SEEDS.map((seed, index) => ({
  id: index + 1,
  name: seed.name,
  slug: seed.slug,
  default_markup_bps: seed.markupBps,
  sort_order: index,
  archived_at: null,
  created_at: isoAt(0),
  updated_at: isoAt(0),
}))

const groupBySlug = new Map(MOCK_GROUPS.map((group) => [group.slug, group]))

// --- item construction ------------------------------------------------------

/** Everything about an item that is stored rather than derived. */
interface ItemSeed {
  name: string | null
  groupSlug: string | null
  keywords: string[]
  stock: number
  reorderLevel: number
  leadDays: number | null
  landedCostPesewas: number
  sellPriceOverridePesewas?: number | null
  hasSupplierLink?: boolean
  discontinued?: { at: string; reason: string }
}

/**
 * The backend's price rule: the override if set, else landed cost grown by the
 * owning group's markup. An item with no group has no markup to grow by, so its
 * price is its landed cost — which is why the `no markup` cell state stays
 * unreachable until `selling_price_pesewas` can come back null.
 */
function sellingPrice(seed: ItemSeed, markupBps: number | null): number {
  if (seed.sellPriceOverridePesewas != null) return seed.sellPriceOverridePesewas
  if (markupBps === null) return seed.landedCostPesewas
  return Math.round((seed.landedCostPesewas * (10_000 + markupBps)) / 10_000)
}

function buildItem(seed: ItemSeed, index: number): ApiItem {
  const group = seed.groupSlug === null ? null : (groupBySlug.get(seed.groupSlug) ?? null)
  const supplierUrl =
    seed.hasSupplierLink === false ? null : `https://supplier.example/sku/${index + 1}`
  const discontinuedAt = seed.discontinued?.at ?? null

  return {
    id: index + 1,
    name: seed.name,
    group_id: group?.id ?? null,
    group: group === null ? null : { id: group.id, name: group.name, slug: group.slug },
    keywords: seed.keywords,
    unit: 'pcs',
    supplier_name: supplierUrl === null ? null : 'Shenzhen Hongyuan Trading',
    supplier_url: supplierUrl,
    supplier_contact: supplierUrl === null ? null : 'sales@hongyuan.example',
    lead_time_days: seed.leadDays,
    reorder_level: seed.reorderLevel,
    selling_price_override_pesewas: seed.sellPriceOverridePesewas ?? null,
    notes: seed.discontinued?.reason ?? null,
    image_url: null,
    landed_unit_cost_pesewas: seed.landedCostPesewas,
    selling_price_pesewas: sellingPrice(seed, group?.default_markup_bps ?? null),
    stock_on_hand: seed.stock,
    // Derived: name or group missing, or supplier_url missing on an item that is
    // not discontinued. A dropped line needs no supplier — it is not being bought.
    needs_attention:
      !seed.name || group === null || (supplierUrl === null && discontinuedAt === null),
    discontinued_at: discontinuedAt,
    discontinue_reason: seed.discontinued?.reason ?? null,
    // Derived: discontinued and sold through.
    ready_to_archive: discontinuedAt !== null && seed.stock <= 0,
    archived_at: null,
    created_at: isoAt(-(index % 180)),
    updated_at: isoAt(-(index % 30)),
  }
}

// --- the rows drawn in frames A1 and A2 -------------------------------------

const REFERENCE_SEEDS: ItemSeed[] = [
  {
    name: 'Tuya no-neutral switch, 2 gang',
    groupSlug: 'switching',
    keywords: ['no-neutral', 'tuya', 'wall switch'],
    stock: 12,
    reorderLevel: 4,
    leadDays: 14,
    landedCostPesewas: 24_860,
  },
  {
    name: 'RGB bulb, E27, 9W',
    groupSlug: 'lighting',
    keywords: ['e27', 'colour', 'bulb'],
    stock: 2,
    reorderLevel: 6,
    leadDays: 21,
    landedCostPesewas: 6_240,
  },
  {
    // No supplier link and not discontinued, so it needs attention; at 0 with no
    // reorder level set, the API also counts it as low.
    name: 'Door sensor, battery',
    groupSlug: 'sensors',
    keywords: ['contact', 'magnetic', 'door'],
    stock: 0,
    reorderLevel: 0,
    leadDays: 10,
    landedCostPesewas: 8_800,
    hasSupplierLink: false,
  },
  {
    // The only row with a price override — it carries the `price overridden` flag.
    name: 'Relay module, 2 channel',
    groupSlug: 'switching',
    keywords: ['relay', 'module', 'retrofit'],
    stock: 6,
    reorderLevel: 3,
    leadDays: 14,
    landedCostPesewas: 18_620,
    sellPriceOverridePesewas: 29_800,
  },
  {
    // The stub: no name, no group. Both flags in one row.
    name: null,
    groupSlug: null,
    keywords: [],
    stock: 3,
    reorderLevel: 0,
    leadDays: null,
    landedCostPesewas: 4_110,
  },
  {
    name: 'CCTV camera, 3MP, outdoor',
    groupSlug: 'security',
    keywords: ['camera', 'bullet', 'poe'],
    stock: 8,
    reorderLevel: 3,
    leadDays: 18,
    landedCostPesewas: 41_280,
  },
  // A2 shows a second relay variant with its own stock and lead time — a
  // different SKU from "Relay module, 2 channel" above.
  {
    name: 'Relay module, 2 ch, no neutral',
    groupSlug: 'switching',
    keywords: ['relay', 'module', 'retrofit'],
    stock: 2,
    reorderLevel: 6,
    leadDays: 21,
    landedCostPesewas: 18_620,
  },
  {
    name: 'Dimmer module, no-neutral',
    groupSlug: 'lighting',
    keywords: ['dimmer', 'trailing edge'],
    stock: 0,
    reorderLevel: 2,
    leadDays: 14,
    landedCostPesewas: 25_750,
  },
  {
    name: 'Smart plug, 16A',
    groupSlug: 'power',
    keywords: ['plug', 'socket', 'metered'],
    stock: 1,
    reorderLevel: 4,
    leadDays: 12,
    landedCostPesewas: 7_490,
  },
  // --- the two rows that exercise the discontinue lifecycle ------------------
  {
    // Below its reorder level, but discontinued — so it is NOT low stock. Selling
    // it down to zero is the plan, not a shortfall.
    name: 'Zigbee hub, v1',
    groupSlug: 'networking',
    keywords: ['hub', 'gateway', 'zigbee'],
    stock: 3,
    reorderLevel: 5,
    leadDays: 18,
    landedCostPesewas: 31_500,
    discontinued: { at: isoAt(-40), reason: 'superseded by the v2 hub' },
  },
  {
    // Discontinued and sold through: ready to archive. It has no supplier link
    // either, which does not count against it — nothing is being reordered.
    name: 'IR blaster, round',
    groupSlug: 'control',
    keywords: ['infrared', 'remote', 'legacy'],
    stock: 0,
    reorderLevel: 2,
    leadDays: null,
    landedCostPesewas: 9_800,
    hasSupplierLink: false,
    discontinued: { at: isoAt(-95), reason: 'supplier discontinued the moulding' },
  },
]

// --- the generated remainder ------------------------------------------------

interface CatalogueSeed {
  slug: string
  bases: string[]
  variants: string[]
  keywords: string[]
  /** Landed cost range, in whole pesewas. */
  cost: [number, number]
}

const CATALOGUE_SEEDS: CatalogueSeed[] = [
  {
    slug: 'lighting',
    bases: ['LED downlight', 'Smart bulb, E27', 'GU10 spot', 'LED strip, 5 m', 'Track light head'],
    variants: ['7W', '9W', '12W', '15W', '18W', '24W'],
    keywords: ['bulb', 'warm white', 'dimmable'],
    cost: [2_800, 21_000],
  },
  {
    slug: 'switching',
    bases: [
      'Wall switch, 1 gang',
      'Wall switch, 2 gang',
      'Wall switch, 3 gang',
      'Scene panel',
      'Touch switch',
    ],
    variants: ['white', 'black', 'grey', 'glass', 'matte', 'brushed'],
    keywords: ['wall switch', 'retrofit', 'gang'],
    cost: [9_500, 38_000],
  },
  {
    slug: 'security',
    bases: ['CCTV camera, 2MP', 'CCTV camera, 4MP', 'NVR, 4 channel', 'Video doorbell', 'Alarm siren'],
    variants: ['indoor', 'outdoor', 'poe', 'wifi', 'battery', 'wired'],
    keywords: ['camera', 'alarm', 'recording'],
    cost: [18_000, 92_000],
  },
  {
    slug: 'climate',
    bases: ['Thermostat', 'AC controller', 'Radiator valve', 'Humidity controller', 'Fan controller'],
    variants: ['basic', 'wifi', 'zigbee', 'display', 'multi-zone', 'programmable'],
    keywords: ['temperature', 'hvac', 'schedule'],
    cost: [12_000, 64_000],
  },
  {
    slug: 'power',
    bases: ['Smart plug, 10A', 'Smart plug, 13A', 'Energy meter', 'Surge protector', 'Extension bar'],
    variants: ['type G', 'type D', 'metered', 'timer', 'compact', 'outdoor'],
    keywords: ['socket', 'load', 'consumption'],
    cost: [4_500, 42_000],
  },
  {
    slug: 'networking',
    bases: ['Wifi router', 'Access point', 'Zigbee hub', 'PoE injector', 'Network switch'],
    variants: ['entry', 'mid', 'pro', 'mesh', 'rack', 'wall mount'],
    keywords: ['wifi', 'ethernet', 'coverage'],
    cost: [14_000, 118_000],
  },
  {
    slug: 'sensors',
    bases: ['Motion sensor', 'Water leak sensor', 'Smoke detector', 'Temperature sensor', 'Light sensor'],
    variants: ['battery', 'wired', 'ceiling', 'corner', 'mini', 'zigbee'],
    keywords: ['detector', 'trigger', 'automation'],
    cost: [5_500, 31_000],
  },
  {
    slug: 'control',
    bases: ['Wall tablet, 7 in', 'Remote, 4 button', 'Keypad, 6 key', 'Gateway', 'IR blaster'],
    variants: ['white', 'black', 'flush', 'surface', 'wifi', 'zigbee'],
    keywords: ['scene', 'hub', 'pairing'],
    cost: [9_000, 145_000],
  },
]

const LEAD_DAY_POOL = [7, 10, 12, 14, 18, 21]

/** Seeded, so the list is identical on every reload. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildGeneratedSeeds(count: number): ItemSeed[] {
  // Every combination of base × variant, per group.
  const byGroup = CATALOGUE_SEEDS.map((seed) =>
    seed.bases.flatMap((base) =>
      seed.variants.map((variant) => ({ seed, name: `${base}, ${variant}`, variant })),
    ),
  )

  // Interleave the groups so the catalogue reads mixed rather than blocked.
  const interleaved: (typeof byGroup)[number] = []
  const deepest = Math.max(...byGroup.map((g) => g.length))
  for (let i = 0; i < deepest; i++) {
    for (const group of byGroup) {
      if (group[i]) interleaved.push(group[i])
    }
  }

  const rnd = mulberry32(0x5eed)

  return interleaved.slice(0, count).map(({ seed, name, variant }) => {
    const [minCost, maxCost] = seed.cost
    const landedCostPesewas = Math.round(minCost + rnd() * (maxCost - minCost))
    const reorderLevel = 2 + Math.floor(rnd() * 5)
    const overridden = rnd() < 0.06

    return {
      name,
      groupSlug: seed.slug,
      keywords: [...seed.keywords, variant],
      // Always above the reorder level: the restocking rows are the hand-written
      // ones, so the summary's counts stay driven by data you can point at.
      stock: reorderLevel + 1 + Math.floor(rnd() * 22),
      reorderLevel,
      leadDays: LEAD_DAY_POOL[Math.floor(rnd() * LEAD_DAY_POOL.length)],
      landedCostPesewas,
      sellPriceOverridePesewas: overridden
        ? Math.round(landedCostPesewas * (1.45 + rnd() * 0.3))
        : null,
    }
  })
}

export const MOCK_ITEMS: ApiItem[] = [
  ...REFERENCE_SEEDS,
  ...buildGeneratedSeeds(TOTAL_ITEMS - REFERENCE_SEEDS.length),
].map(buildItem)

// --- the summary, derived the way GET /summary derives it -------------------

/** There is no shipments mock: the catalogue page reads both of these from /summary. */
const DRAFT_SHIPMENT_COUNT = 1
const NEXT_DRAFT_ETA = '2026-09-24T00:00:00Z'

const isLowStock = (item: ApiItem) =>
  item.discontinued_at === null && item.stock_on_hand <= item.reorder_level

function buildSummary(items: ApiItem[]): ApiSummary {
  const active = items.filter((item) => item.archived_at === null)
  const restocking = active.filter(isLowStock)
  const leads = restocking
    .map((item) => item.lead_time_days)
    .filter((days): days is number => days !== null)

  return {
    capital_in_stock_pesewas: active.reduce(
      (total, item) => total + item.stock_on_hand * item.landed_unit_cost_pesewas,
      0,
    ),
    retail_value_pesewas: active.reduce(
      (total, item) => total + item.stock_on_hand * item.selling_price_pesewas,
      0,
    ),
    units_in_stock: active.reduce((total, item) => total + item.stock_on_hand, 0),
    items_needing_restock: restocking.length,
    longest_restock_lead_days: leads.length === 0 ? null : Math.max(...leads),
    items_needing_attention: active.filter((item) => item.needs_attention).length,
    items_ready_to_archive: active.filter((item) => item.ready_to_archive).length,
    draft_shipment_count: DRAFT_SHIPMENT_COUNT,
    next_draft_eta: NEXT_DRAFT_ETA,
  }
}

export const MOCK_SUMMARY: ApiSummary = buildSummary(MOCK_ITEMS)

/** Displayed in the app bar. Not derived — the screen is UI-only. */
export const SAVE_STATUS_DATE = 'Sat 6 Sep'

/** Simulated first load, so the skeleton state the handoff specifies is real. */
export const MOCK_LOAD_MS = 320
