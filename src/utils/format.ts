/**
 * Display conventions from the handoff. Visual only — no money arithmetic
 * beyond rendering what it is handed.
 */

const TWO_DP = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const WHOLE = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** Money inside a table cell or a phone row — two decimals, no currency mark. */
export const formatMoney = (value: number) => TWO_DP.format(value)

/** A summary figure — `GH₵` appears here and in form prefixes, nowhere else. */
export const formatCurrency = (value: number) => `GH₵ ${WHOLE.format(value)}`

export const formatCount = (value: number) => WHOLE.format(value)

export const formatLead = (days: number) => `${days} d`

export const formatMargin = (percent: number) => `${percent}%`

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
