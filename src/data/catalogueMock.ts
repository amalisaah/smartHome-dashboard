import type { CatalogueGroup, CatalogueItem, DraftShipmentSummary } from '@/types/catalogue'

/**
 * Local mock data for the catalogue list. Shaped to the handoff's "What the UI
 * needs to render" section only — no product rules, no money arithmetic beyond
 * what the screen displays.
 *
 * The nine items below are the ones drawn in the reference frames; the rest are
 * generated so the counts on screen (214 items, 8 groups, 4 restocking, 2 needing
 * attention, 3 matching "neut") are really derived rather than hardcoded.
 */

const TOTAL_ITEMS = 214

/** The rows drawn in frames A1 and A2. */
const REFERENCE_ITEMS: CatalogueItem[] = [
  {
    id: 'ref-tuya-no-neutral-2g',
    name: 'Tuya no-neutral switch, 2 gang',
    group: 'switching',
    keywords: ['no-neutral', 'tuya', 'wall switch'],
    stock: 12,
    reorderLevel: 4,
    leadDays: 14,
    landedCost: 248.6,
    sellPrice: 373.0,
    hasSupplierLink: true,
    priceOverridden: false,
  },
  {
    id: 'ref-rgb-bulb-e27',
    name: 'RGB bulb, E27, 9W',
    group: 'lighting',
    keywords: ['e27', 'colour', 'bulb'],
    stock: 2,
    reorderLevel: 6,
    leadDays: 21,
    landedCost: 62.4,
    sellPrice: 99.0,
    hasSupplierLink: true,
    priceOverridden: false,
  },
  {
    id: 'ref-door-sensor',
    name: 'Door sensor, battery',
    group: 'sensors',
    keywords: ['contact', 'magnetic', 'door'],
    stock: 0,
    reorderLevel: 0,
    leadDays: 10,
    landedCost: 88.0,
    sellPrice: 145.0,
    hasSupplierLink: false,
    priceOverridden: false,
  },
  {
    id: 'ref-relay-2ch',
    name: 'Relay module, 2 channel',
    group: 'switching',
    keywords: ['relay', 'module', 'retrofit'],
    stock: 6,
    reorderLevel: 3,
    leadDays: 14,
    landedCost: 186.2,
    sellPrice: 298.0,
    hasSupplierLink: true,
    priceOverridden: true,
  },
  {
    id: 'ref-untitled',
    name: null,
    group: null,
    keywords: [],
    stock: 3,
    reorderLevel: 0,
    leadDays: null,
    landedCost: 41.1,
    sellPrice: null,
    hasSupplierLink: true,
    priceOverridden: false,
  },
  {
    id: 'ref-cctv-3mp',
    name: 'CCTV camera, 3MP, outdoor',
    group: 'security',
    keywords: ['camera', 'bullet', 'poe'],
    stock: 8,
    reorderLevel: 3,
    leadDays: 18,
    landedCost: 412.8,
    sellPrice: 660.0,
    hasSupplierLink: true,
    priceOverridden: false,
  },
  // A2 shows a second relay variant with its own stock and lead time — a
  // different SKU from "Relay module, 2 channel" above.
  {
    id: 'ref-relay-2ch-no-neutral',
    name: 'Relay module, 2 ch, no neutral',
    group: 'switching',
    keywords: ['relay', 'module', 'retrofit'],
    stock: 2,
    reorderLevel: 6,
    leadDays: 21,
    landedCost: 186.2,
    sellPrice: 298.0,
    hasSupplierLink: true,
    priceOverridden: false,
  },
  {
    id: 'ref-dimmer-no-neutral',
    name: 'Dimmer module, no-neutral',
    group: 'lighting',
    keywords: ['dimmer', 'trailing edge'],
    stock: 0,
    reorderLevel: 2,
    leadDays: 14,
    landedCost: 257.5,
    sellPrice: 412.0,
    hasSupplierLink: true,
    priceOverridden: false,
  },
  {
    id: 'ref-smart-plug-16a',
    name: 'Smart plug, 16A',
    group: 'power',
    keywords: ['plug', 'socket', 'metered'],
    stock: 1,
    reorderLevel: 4,
    leadDays: 12,
    landedCost: 74.9,
    sellPrice: 119.0,
    hasSupplierLink: true,
    priceOverridden: false,
  },
]

interface GroupSeed {
  group: CatalogueGroup
  bases: string[]
  variants: string[]
  keywords: string[]
  /** Landed cost range, in GH₵. */
  cost: [number, number]
}

const GROUP_SEEDS: GroupSeed[] = [
  {
    group: 'lighting',
    bases: ['LED downlight', 'Smart bulb, E27', 'GU10 spot', 'LED strip, 5 m', 'Track light head'],
    variants: ['7W', '9W', '12W', '15W', '18W', '24W'],
    keywords: ['bulb', 'warm white', 'dimmable'],
    cost: [28, 210],
  },
  {
    group: 'switching',
    bases: ['Wall switch, 1 gang', 'Wall switch, 2 gang', 'Wall switch, 3 gang', 'Scene panel', 'Touch switch'],
    variants: ['white', 'black', 'grey', 'glass', 'matte', 'brushed'],
    keywords: ['wall switch', 'retrofit', 'gang'],
    cost: [95, 380],
  },
  {
    group: 'security',
    bases: ['CCTV camera, 2MP', 'CCTV camera, 4MP', 'NVR, 4 channel', 'Video doorbell', 'Alarm siren'],
    variants: ['indoor', 'outdoor', 'poe', 'wifi', 'battery', 'wired'],
    keywords: ['camera', 'alarm', 'recording'],
    cost: [180, 920],
  },
  {
    group: 'climate',
    bases: ['Thermostat', 'AC controller', 'Radiator valve', 'Humidity controller', 'Fan controller'],
    variants: ['basic', 'wifi', 'zigbee', 'display', 'multi-zone', 'programmable'],
    keywords: ['temperature', 'hvac', 'schedule'],
    cost: [120, 640],
  },
  {
    group: 'power',
    bases: ['Smart plug, 10A', 'Smart plug, 13A', 'Energy meter', 'Surge protector', 'Extension bar'],
    variants: ['type G', 'type D', 'metered', 'timer', 'compact', 'outdoor'],
    keywords: ['socket', 'load', 'consumption'],
    cost: [45, 420],
  },
  {
    group: 'networking',
    bases: ['Wifi router', 'Access point', 'Zigbee hub', 'PoE injector', 'Network switch'],
    variants: ['entry', 'mid', 'pro', 'mesh', 'rack', 'wall mount'],
    keywords: ['wifi', 'ethernet', 'coverage'],
    cost: [140, 1180],
  },
  {
    group: 'sensors',
    bases: ['Motion sensor', 'Water leak sensor', 'Smoke detector', 'Temperature sensor', 'Light sensor'],
    variants: ['battery', 'wired', 'ceiling', 'corner', 'mini', 'zigbee'],
    keywords: ['detector', 'trigger', 'automation'],
    cost: [55, 310],
  },
  {
    group: 'control',
    bases: ['Wall tablet, 7 in', 'Remote, 4 button', 'Keypad, 6 key', 'Gateway', 'IR blaster'],
    variants: ['white', 'black', 'flush', 'surface', 'wifi', 'zigbee'],
    keywords: ['scene', 'hub', 'pairing'],
    cost: [90, 1450],
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

const round2 = (n: number) => Math.round(n * 100) / 100

function buildGeneratedItems(count: number): CatalogueItem[] {
  // Every combination of base × variant, per group.
  const byGroup = GROUP_SEEDS.map((seed) =>
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

  return interleaved.slice(0, count).map(({ seed, name, variant }, index) => {
    const [minCost, maxCost] = seed.cost
    const landedCost = round2(minCost + rnd() * (maxCost - minCost))
    const markup = 1.5 + rnd() * 0.25
    const reorderLevel = 2 + Math.floor(rnd() * 5)

    return {
      id: `gen-${index}`,
      name,
      group: seed.group,
      keywords: [...seed.keywords, variant],
      // Always above the reorder level: the four restocking rows are the
      // hand-written ones, so the summary count stays honest.
      stock: reorderLevel + 1 + Math.floor(rnd() * 22),
      reorderLevel,
      leadDays: LEAD_DAY_POOL[Math.floor(rnd() * LEAD_DAY_POOL.length)],
      landedCost,
      sellPrice: round2(landedCost * markup),
      hasSupplierLink: true,
      priceOverridden: rnd() < 0.06,
    }
  })
}

export const CATALOGUE_ITEMS: CatalogueItem[] = [
  ...REFERENCE_ITEMS,
  ...buildGeneratedItems(TOTAL_ITEMS - REFERENCE_ITEMS.length),
]

export const DRAFT_SHIPMENTS: DraftShipmentSummary = {
  count: 1,
  nextArrival: '24 Sep',
}

/** Displayed in the app bar. Not derived — the screen is UI-only. */
export const SAVE_STATUS_DATE = 'Sat 6 Sep'

/** Simulated first load, so the skeleton state the handoff specifies is real. */
export const MOCK_LOAD_MS = 320
