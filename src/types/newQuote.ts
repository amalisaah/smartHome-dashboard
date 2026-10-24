/**
 * Starting a quote — modules 3+4, block G.
 *
 * Two shapes and the phrases they produce. `NewQuoteCustomer` is a customer as
 * this picker needs her: her name, her number, and the houses that could be
 * quoted. Everything a row says about her is derived here, in one place, so the
 * sheet and the dialog cannot word the same customer differently.
 */

/** One of her houses, as a row in step 2 names it. */
export interface NewQuoteHouse {
  id: number
  /** The house's label — `East Legon`. Never blank; unnamed houses say so. */
  area: string
  /**
   * How many rooms have been walked.
   *
   * **Null means not read yet**, not zero. The wire carries no room count on a
   * house, so it is one request per house and it is made when he picks the
   * customer rather than when the picker opens. A row holding null is a row
   * whose count is still in flight — and the difference matters, because zero
   * is the one value that makes a house unquotable.
   */
  roomCount: number | null
}

/** A customer as step 1 lists her. */
export interface NewQuoteCustomer {
  id: number
  name: string
  /** Null for a record taken down without one. */
  phone: string | null
  /** Hers, archived ones excluded. Empty is a real and common answer. */
  houses: NewQuoteHouse[]
}

/**
 * The right-hand figure on a customer row: `no house yet`, the area when there
 * is one house, or `3 houses`.
 *
 * It never mentions rooms. Rooms are not known at this point and asking for
 * them would be a request per house of every customer on screen — the whole
 * reason the count is read on the tap instead.
 */
export function houseMeta(customer: NewQuoteCustomer): string {
  const { houses } = customer
  if (houses.length === 0) return 'no house yet'
  if (houses.length === 1) return houses[0].area
  return `${houses.length} houses`
}

/** `7 rooms`, `1 room`, or nothing to say while the count is still in flight. */
export function roomsPhrase(house: NewQuoteHouse): string {
  if (house.roomCount === null) return ''
  return house.roomCount === 1 ? '1 room' : `${house.roomCount} rooms`
}

/**
 * Whether this house can carry a quote.
 *
 * A house whose count has not landed is **not** quotable yet — null is "we do
 * not know", and offering a row we cannot vouch for would be the one way to
 * start a quote against a house with nothing in it.
 */
export const isQuotable = (house: NewQuoteHouse): boolean =>
  house.roomCount !== null && house.roomCount > 0

/** Name, number or any of her areas. The three things he would type. */
export function customerMatches(customer: NewQuoteCustomer, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const haystack = [customer.name, customer.phone ?? '', ...customer.houses.map((h) => h.area)]
  return haystack.join(' ').toLowerCase().includes(needle)
}

/**
 * The label over the list. `RECENT` is the order the endpoint answers in and
 * the reason the top row is usually the person he is standing with; `MATCHES`
 * says the list is no longer that order.
 */
export const listLabel = (query: string): string => (query.trim() ? 'Matches' : 'Recent')
