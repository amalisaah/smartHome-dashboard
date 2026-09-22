/**
 * The groups & markup screen's view model. Only what a cell renders — the
 * handoff's "What the UI needs to render" list, nothing behind it.
 *
 * Markup is carried as basis points, the same unit the catalogue already speaks
 * (`6000` = a markup of 1.60), so the two screens cannot disagree about what a
 * group's multiplier is. Money stays in integer pesewas to the formatter.
 */

/** One row of the table, at rest. */
export interface MarkupGroup {
  id: number
  name: string
  slug: string
  /** The saved markup — what the input reverts to. Basis points. */
  markupBps: number
  itemCount: number
  /** Whole percent, as drawn. */
  avgMarginPercent: number
  /**
   * What the stock in this group cost to put on the shelf — integer pesewas,
   * stock × landed unit cost, the same figure the catalogue calls capital in
   * stock. It is what the markup on this row is standing on.
   */
  capitalInStockPesewas: number
  /**
   * Items whose price was set by hand; they keep it. No longer a column of its
   * own, but the commit bar still says the number out loud and nets it off the
   * count it is about to change.
   */
  overriddenCount: number
}

/**
 * What one dirty row projects, handed to the UI already worked out. The screen
 * renders these; it does not compute them.
 */
export interface MarkupProjection {
  slug: string
  /** Basis points — what the draft in the input parses to. */
  markupBps: number
  projectedMarginPercent: number
  /** Items the change reaches: the group's count less its overridden ones. */
  affectedCount: number
  /**
   * Null for a group that holds no items yet — there is nothing to name, and a
   * made-up example would be the one part of the commit bar that is not
   * checkable.
   */
  example: MarkupExample | null
}

/** One named item with both its prices — the checkable half of the consequence. */
export interface MarkupExample {
  itemName: string
  oldPricePesewas: number
  newPricePesewas: number
}

/**
 * The commit bar's first line, split where the count is bolded. Built as three
 * parts rather than one string so the figure can be mono without the sentence
 * carrying markup.
 */
export interface CommitSentence {
  lead: string
  /** `39 of 44` — the bolded mono half of rule 2. */
  count: string
  tail: string
}

/** Everything the commit bar says, worked out before it is drawn. */
export interface CommitSummary {
  sentence: CommitSentence
  /** Second line: what is excluded and why, then the one worked example. */
  detail: string
  /** The count travels in the button label, so reading only buttons still works. */
  applyLabel: string
}

/** A markup as the user types it (`1.65`) → basis points. */
export const markupToBps = (text: string) => Math.round((Number(text) - 1) * 10_000)

/** Basis points → the two decimals the field holds. */
export const bpsToMarkup = (bps: number) => (1 + bps / 10_000).toFixed(2)
