import { computed, reactive, ref } from 'vue'
import { MOCK_GROUPS_TABLE, projectMarkup } from '@/data/groupsMock'
import {
  bpsToMarkup,
  markupToBps,
  type CommitSummary,
  type MarkupExample,
  type MarkupGroup,
  type MarkupProjection,
} from '@/types/groups'
import { formatMoney } from '@/utils/format'

/** One row as the table draws it: the saved group, plus what he is typing at it. */
export interface MarkupRow {
  group: MarkupGroup
  /** What the field holds — text, because it is mid-typed for most of its life. */
  draft: string
  /** Null at rest. Present exactly when the row is dirty. */
  projection: MarkupProjection | null
}

/**
 * A markup the screen can project from. A field that is blank, or mid-typed as
 * `1.`, holds no change yet — the row stays at rest and no commit bar appears,
 * rather than the screen inventing an error state the design does not draw.
 */
const usable = (text: string) => {
  const value = Number(text)
  return text.trim() !== '' && Number.isFinite(value) && value > 0
}

/** Digits and one decimal point, as the field accepts them. */
function sanitise(text: string) {
  const kept = text.replace(/[^\d.]/g, '')
  const firstDot = kept.indexOf('.')
  if (firstDot === -1) return kept
  return kept.slice(0, firstDot + 1) + kept.slice(firstDot + 1).replace(/\./g, '')
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

/** `the 2-gang switch goes 373.00 → 410.19` — a name is checkable, a count is not. */
const exampleLine = (example: MarkupExample) =>
  `Example: the ${example.itemName} goes ${formatMoney(example.oldPricePesewas)} → ${formatMoney(
    example.newPricePesewas,
  )}.`

/**
 * The groups & markup screen: eight fixed rows, a draft markup at each, and the
 * consequence of every draft worked out while he types. Nothing here creates,
 * deletes or reorders a group.
 */
export function useGroupsMarkup() {
  /** The saved side. Apply writes here; Discard reads back from it. */
  const groups = ref<MarkupGroup[]>(MOCK_GROUPS_TABLE.map((group) => ({ ...group })))

  /** What each field holds, by slug. Seeded from the saved markup at two decimals. */
  const drafts = reactive<Record<string, string>>(
    Object.fromEntries(groups.value.map((group) => [group.slug, bpsToMarkup(group.markupBps)])),
  )

  /** The change a row is holding, or null when it is holding none. */
  function changeAt(group: MarkupGroup): MarkupProjection | null {
    const text = drafts[group.slug] ?? ''
    if (!usable(text)) return null

    const bps = markupToBps(text)
    if (bps === group.markupBps) return null

    return projectMarkup(group.slug, bps)
  }

  const rows = computed<MarkupRow[]>(() =>
    groups.value.map((group) => ({
      group,
      draft: drafts[group.slug] ?? '',
      projection: changeAt(group),
    })),
  )

  const dirtyRows = computed(() => rows.value.filter((row) => row.projection !== null))

  const affectedCount = computed(() =>
    dirtyRows.value.reduce((total, row) => total + (row.projection?.affectedCount ?? 0), 0),
  )

  /**
   * The commit bar, or nothing at all. It states the consequence in numbers and
   * names one item, because an aggregate alone is not checkable.
   */
  const commit = computed<CommitSummary | null>(() => {
    const dirty = dirtyRows.value
    if (!dirty.length) return null

    const totalItems = dirty.reduce((total, row) => total + row.group.itemCount, 0)
    const excluded = dirty.reduce((total, row) => total + row.group.overriddenCount, 0)
    const count = `${affectedCount.value} of ${totalItems}`

    // One dirty row names its own numbers; several name how many groups moved.
    // Either way the worked example comes from the largest affected group.
    const lead =
      dirty.length === 1
        ? `${dirty[0].group.name} ${bpsToMarkup(dirty[0].group.markupBps)} → ${bpsToMarkup(
            dirty[0].projection!.markupBps,
          )} moves the selling price of `
        : `Changes in ${plural(dirty.length, 'group')} move the selling price of `

    const largest = dirty.reduce((biggest, row) =>
      (row.projection?.affectedCount ?? 0) > (biggest.projection?.affectedCount ?? 0)
        ? row
        : biggest,
    )

    // Zero excluded is never said as "0" — the clause simply is not there.
    const keep = excluded
      ? `${plural(excluded, 'overridden item')} keep their price${excluded === 1 ? '' : 's'}. `
      : ''

    return {
      sentence: { lead, count, tail: ' items.' },
      detail: `${keep}${exampleLine(largest.projection!.example)}`,
      applyLabel: `Apply to ${plural(affectedCount.value, 'item')}`,
    }
  })

  // --- what he does to a row -------------------------------------------------

  const setDraft = (slug: string, text: string) => {
    drafts[slug] = sanitise(text)
  }

  const savedText = (slug: string) => {
    const group = groups.value.find((candidate) => candidate.slug === slug)
    return group ? bpsToMarkup(group.markupBps) : ''
  }

  /**
   * Leaving the field says the number back in full. A field left holding
   * nothing usable was never a change, so it goes back to what it was.
   */
  function normalise(slug: string) {
    const text = drafts[slug] ?? ''
    drafts[slug] = usable(text) ? Number(text).toFixed(2) : savedText(slug)
  }

  const revert = (slug: string) => {
    drafts[slug] = savedText(slug)
  }

  const discardAll = () => {
    for (const group of groups.value) drafts[group.slug] = bpsToMarkup(group.markupBps)
  }

  /**
   * The press. Every dirty row's draft becomes its saved markup and its figures
   * settle on the projection that was on screen — the bar dismisses because
   * nothing is dirty any more, not because it was told to.
   */
  function apply() {
    if (!commit.value) return

    groups.value = groups.value.map((group) => {
      const projection = changeAt(group)
      if (!projection) return group
      return {
        ...group,
        markupBps: projection.markupBps,
        avgMarginPercent: projection.projectedMarginPercent,
      }
    })

    for (const group of groups.value) drafts[group.slug] = bpsToMarkup(group.markupBps)
  }

  return { rows, dirtyRows, affectedCount, commit, setDraft, normalise, revert, discardAll, apply }
}
