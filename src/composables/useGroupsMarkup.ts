import { computed, reactive, ref } from 'vue'
import { createGroup, MOCK_GROUPS_TABLE, projectMarkup, slugify } from '@/data/groupsMock'
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
export const usable = (text: string) => {
  const value = Number(text)
  return text.trim() !== '' && Number.isFinite(value) && value > 0
}

/**
 * Digits and one decimal point, as the field accepts them. This is the rule for
 * a markup edited in a table row, where there is nowhere to put an error — the
 * add-group dialog has an error slot, so it lets the text land and says so.
 */
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

/** What the bar says when every dirty row is a group with nothing in it. */
const EMPTY_GROUP_DETAIL = 'Nothing reprices now — the markup prices items as you add them.'

/**
 * The groups & markup screen: a row per group, a draft markup at each, and the
 * consequence of every draft worked out while he types. A group can be created
 * here; nothing here deletes or reorders one.
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
    const named = `${dirty[0].group.name} ${bpsToMarkup(dirty[0].group.markupBps)} → ${bpsToMarkup(
      dirty[0].projection?.markupBps ?? dirty[0].group.markupBps,
    )}`

    const lead =
      dirty.length === 1
        ? `${named} moves the selling price of `
        : `Changes in ${plural(dirty.length, 'group')} move the selling price of `

    // A group made on this screen holds nothing yet, so its markup moves no
    // price at all. Said as that, rather than as "0 of 0 items".
    if (affectedCount.value === 0) {
      return {
        sentence: {
          lead: dirty.length === 1 ? `${named} — ` : `Changes in ${plural(dirty.length, 'group')} — `,
          count: 'nothing',
          tail: ' to reprice yet.',
        },
        detail: EMPTY_GROUP_DETAIL,
        applyLabel: `Save ${plural(dirty.length, 'markup')}`,
      }
    }

    // The example has to come from a group that has items to make one from.
    const largest = dirty
      .filter((row) => row.projection?.example)
      .reduce<MarkupRow | null>(
        (biggest, row) =>
          !biggest || (row.projection?.affectedCount ?? 0) > (biggest.projection?.affectedCount ?? 0)
            ? row
            : biggest,
        null,
      )

    // Zero excluded is never said as "0" — the clause simply is not there.
    const keep = excluded
      ? `${plural(excluded, 'overridden item')} keep their price${excluded === 1 ? '' : 's'}. `
      : ''

    return {
      sentence: { lead, count, tail: ' items.' },
      detail: `${keep}${largest ? exampleLine(largest.projection!.example!) : ''}`.trim(),
      applyLabel: `Apply to ${plural(affectedCount.value, 'item')}`,
    }
  })

  // --- making one ------------------------------------------------------------

  /** By slug, so `Smoke` and `smoke` are the same group and not two. */
  const nameTaken = (name: string) => {
    const slug = slugify(name)
    return slug !== '' && groups.value.some((group) => group.slug === slug)
  }

  /**
   * A new group, saved the moment it is made — there is nothing to preview,
   * because an empty group reprices nothing.
   *
   * The markup is optional: left blank, the group starts at `1.00`, which is
   * the only honest reading of a blank markup — it sells at cost until he says
   * otherwise. The dialog says so before he presses.
   */
  function addGroup(name: string, markupText: string) {
    // Group names are a lowercase vocabulary — `lighting`, `switching`. A row
    // reading `Smoke & gas` among eight of those is the odd one out, and the
    // slug is lowercase regardless, so the name follows it.
    const trimmed = name.trim().toLowerCase()
    if (!trimmed || nameTaken(trimmed)) return null

    const group = createGroup(trimmed, usable(markupText) ? markupToBps(markupText) : 0)
    groups.value = [...groups.value, group]
    drafts[group.slug] = bpsToMarkup(group.markupBps)
    return group
  }

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

  return {
    rows,
    dirtyRows,
    affectedCount,
    commit,
    addGroup,
    nameTaken,
    setDraft,
    normalise,
    revert,
    discardAll,
    apply,
  }
}
