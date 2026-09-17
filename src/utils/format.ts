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

const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

/** Money inside a table cell or a phone row — two decimals, no currency mark. */
export const formatMoney = (pesewas: number) => TWO_DP.format(pesewas / 100)

/** A summary figure — `GH₵` appears here and in form prefixes, nowhere else. */
export const formatCurrency = (pesewas: number) => `GH₵ ${WHOLE.format(pesewas / 100)}`

export const formatCount = (value: number) => WHOLE.format(value)

export const formatLead = (days: number) => `${days} d`

export const formatMargin = (percent: number) => `${percent}%`

/** An ISO date-time as `24 Sep` — shipment ETAs, and nothing else so far. */
export const formatShortDate = (iso: string) => SHORT_DATE.format(new Date(iso))

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
