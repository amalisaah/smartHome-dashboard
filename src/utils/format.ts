/**
 * Display conventions from the handoff. Visual only — no money arithmetic beyond
 * rendering what it is handed.
 *
 * Money arrives as integer pesewas (1 GHS = 100 pesewas) and is divided down
 * here, at the last possible moment, so sums upstream stay in whole units.
 */

const TWO_DP = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const WHOLE = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

const ONE_DP = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Day and month are formatted apart on purpose: the convention is `24 Sep`, and
 * an `en-GB` short month spells September `Sept`, which is a character wider in
 * every chip it appears in. `en-US` gives the three-letter form the design uses.
 */
const SHORT_DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric' })
const SHORT_MONTH = new Intl.DateTimeFormat('en-US', { month: 'short' })

/** Money inside a table cell or a phone row — two decimals, no currency mark. */
export const formatMoney = (pesewas: number) => TWO_DP.format(pesewas / 100)

/** A summary figure — `GH₵` appears here and in form prefixes, nowhere else. */
export const formatCurrency = (pesewas: number) => `GH₵ ${WHOLE.format(pesewas / 100)}`

/**
 * A total, to the pesewa. `formatCurrency` rounds to whole cedis for a summary
 * figure; a shipment total is money he will reconcile against paper, so it keeps
 * its decimals.
 */
export const formatCedi = (pesewas: number) => `GH₵ ${TWO_DP.format(pesewas / 100)}`

/** The symbol a currency code shows in a header caption or a field prefix. */
export const currencySymbol = (code: string) =>
  ({ USD: '$', CNY: '¥' } as Record<string, string>)[code] ?? code

/** A figure in the invoice's own currency — `$ 658.20`. */
export const formatInvoice = (minorUnits: number, code: string) =>
  `${currencySymbol(code)} ${TWO_DP.format(minorUnits / 100)}`

export const formatCount = (value: number) => WHOLE.format(value)

/** Share of a shipment — one decimal, the only percentage that carries one. */
export const formatShare = (percent: number) => `${ONE_DP.format(percent)}%`

/** Basis points as the multiplier he reads it as: 5000 → `1.50`. */
export const formatMarkup = (bps: number) => TWO_DP.format(1 + bps / 10_000)

export const formatLead = (days: number) => `${days} d`

export const formatMargin = (percent: number) => `${percent}%`

/** An ISO date-time as `24 Sep` — chips and captions. */
export const formatShortDate = (iso: string) => {
  const date = new Date(iso)
  return `${SHORT_DAY.format(date)} ${SHORT_MONTH.format(date)}`
}

/** Splits `text` into matched / unmatched runs for the search highlight. */
export function splitOnMatch(text: string, query: string): { text: string; match: boolean }[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [{ text, match: false }]

  const parts: { text: string; match: boolean }[] = []
  const haystack = text.toLowerCase()
  let cursor = 0

  for (;;) {
    const at = haystack.indexOf(needle, cursor)
    if (at === -1) break
    if (at > cursor) parts.push({ text: text.slice(cursor, at), match: false })
    parts.push({ text: text.slice(at, at + needle.length), match: true })
    cursor = at + needle.length
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false })
  return parts
}
