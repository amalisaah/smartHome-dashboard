import { computed, reactive, toValue, watch, type MaybeRefOrGetter } from 'vue'
import {
  bpsToMarkup,
  markupToBps,
  slugify,
  type CommitSummary,
  type MarkupGroup,
  type MarkupProjection,
} from '@/types/groups'

/** One row's press, as the screen holds it. The view maps it to the wire. */
export interface PendingEdit {
  id: number
  name?: string
  markupBps?: number
}

/** One row as the table draws it: the saved group, plus what he is typing at it. */
export interface MarkupRow {
  group: MarkupGroup
  /** What the field holds — text, because it is mid-typed for most of its life. */
  draft: string
  /** What the name field holds. */
  nameDraft: string
  /** Null at rest. Present exactly when the markup field holds a change. */
  projection: MarkupProjection | null
  /** The name it would be saved under, or null when the name has not moved. */
  rename: string | null
  /**
   * Why this row cannot be saved, said as what it stops. Empty when it can be.
   * It is the row's to show — validation belongs where the problem is.
   */
  nameError: string
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

/**
 * A typed name as it would be saved. Group names are a lowercase vocabulary —
 * `lighting`, `switching` — so the field takes his capitals and the table holds
 * it in the one case every other row is in.
 */
export const settled = (name: string) => name.trim().toLowerCase()

/** What the bar says when every dirty row is a group with nothing in it. */
const EMPTY_GROUP_DETAIL = 'Nothing reprices now — the markup prices items as you add them.'

/** What the bar says when the only thing he changed was a label. */
const RENAME_DETAIL =
  'The items stay in the group and keep their prices. The name changes everywhere it is shown.'

/**
 * The groups & markup screen: a row per group, a draft markup at each, and the
 * consequence of every draft worked out while he types. A group can be created
 * here; nothing here deletes or reorders one.
 */
export function useGroupsMarkup(source: MaybeRefOrGetter<MarkupGroup[]>) {
  /** The saved side, as the server last answered it. Discard reads back from it. */
  const groups = computed(() => toValue(source))

  /** What each markup field holds — text, because it is mid-typed most of its life. */
  const drafts = reactive<Record<string, string>>({})

  /**
   * What each name field holds. The slug is never one of these: it is the
   * group's identity, and every catalogue item points at it, so a rename
   * changes the label and nothing else.
   */
  const names = reactive<Record<string, string>>({})

  /**
   * What the server last said each field was. A field still holding that
   * follows the next answer; a field he has typed into keeps his text. Without
   * it a background refetch would either stamp on what he is writing or leave
   * a row reading dirty against a value nobody edited.
   */
  const answered = new Map<string, { markup: string; name: string }>()

  watch(
    groups,
    (list) => {
      const live = new Set(list.map((group) => group.slug))
      for (const slug of Object.keys(drafts)) {
        if (live.has(slug)) continue
        delete drafts[slug]
        delete names[slug]
        answered.delete(slug)
      }

      for (const group of list) {
        const markup = bpsToMarkup(group.markupBps)
        const last = answered.get(group.slug)
        if (!last || drafts[group.slug] === last.markup) drafts[group.slug] = markup
        if (!last || names[group.slug] === last.name) names[group.slug] = group.name
        answered.set(group.slug, { markup, name: group.name })
      }
    },
    { immediate: true },
  )

  /**
   * The change a row is holding, or null when it is holding none. An overridden
   * item keeps the price it was given, so the change reaches the rest.
   */
  function changeAt(group: MarkupGroup): MarkupProjection | null {
    const text = drafts[group.slug] ?? ''
    if (!usable(text)) return null

    const bps = markupToBps(text)
    if (bps === group.markupBps) return null

    return {
      slug: group.slug,
      markupBps: bps,
      affectedCount: group.itemCount - group.overriddenCount,
    }
  }

  /** The name a row would be saved under, or null when it has not moved. */
  function renameAt(group: MarkupGroup): string | null {
    const wanted = settled(names[group.slug] ?? '')
    return wanted && wanted !== group.name ? wanted : null
  }

  /**
   * Said as what it stops, in the row that has the problem. A name the field is
   * still in the middle of is not an error — only an empty one, or one that
   * would leave two groups answering to the same thing.
   */
  function nameErrorAt(group: MarkupGroup): string {
    const wanted = settled(names[group.slug] ?? '')
    if (!wanted) return 'blocks saving — name it'

    // Only the row that moved is at fault. A group sitting at the name it has
    // always had is not the one with the problem when someone types that name
    // into another row — flagging both would blame the wrong row.
    if (wanted === group.name) return ''
    return nameTaken(wanted, group.slug) ? 'blocks saving — already a group' : ''
  }

  const rows = computed<MarkupRow[]>(() =>
    groups.value.map((group) => ({
      group,
      draft: drafts[group.slug] ?? '',
      nameDraft: names[group.slug] ?? '',
      projection: changeAt(group),
      rename: renameAt(group),
      nameError: nameErrorAt(group),
    })),
  )

  /** Rows whose markup moved — the only ones with a price consequence. */
  const pricedRows = computed(() => rows.value.filter((row) => row.projection !== null))

  /** Rows whose name moved. A rename costs nothing and reprices nothing. */
  const renamedRows = computed(() => rows.value.filter((row) => row.rename !== null))

  const dirtyRows = computed(() =>
    rows.value.filter((row) => row.projection !== null || row.rename !== null),
  )

  /** A row with a bad name holds the whole press — the row says why. */
  const blocked = computed(() => rows.value.some((row) => row.nameError !== ''))

  const affectedCount = computed(() =>
    pricedRows.value.reduce((total, row) => total + (row.projection?.affectedCount ?? 0), 0),
  )

  /**
   * The commit bar, or nothing at all. It states the consequence in numbers and
   * names one item, because an aggregate alone is not checkable.
   */
  const commit = computed<CommitSummary | null>(() => {
    const priced = pricedRows.value
    const renamed = renamedRows.value
    if (!priced.length && !renamed.length) return null

    // `lighting becomes lights` — both halves, because the old name is what he
    // is checking it against. Several renames are only worth counting.
    const renameClause =
      renamed.length === 1
        ? `${renamed[0].group.name} becomes ${renamed[0].rename}`
        : `${plural(renamed.length, 'group')} renamed`

    // A rename moves a label. On its own there is no price consequence to state,
    // and saying one in item counts would invent a consequence it does not have.
    if (!priced.length) {
      return {
        sentence: {
          lead: renamed.length === 1 ? `${renamed[0].group.name} becomes ` : 'Renaming ',
          count: renamed.length === 1 ? renamed[0].rename! : plural(renamed.length, 'groups'),
          tail: '.',
        },
        detail: RENAME_DETAIL,
        applyLabel: `Save ${plural(renamed.length, 'rename')}`,
      }
    }

    const totalItems = priced.reduce((total, row) => total + row.group.itemCount, 0)
    const excluded = priced.reduce((total, row) => total + row.group.overriddenCount, 0)
    const count = `${affectedCount.value} of ${totalItems}`

    // One priced row names its own numbers; several name how many groups moved.
    // Either way the worked example comes from the largest affected group.
    const named = `${priced[0].group.name} ${bpsToMarkup(priced[0].group.markupBps)} → ${bpsToMarkup(
      priced[0].projection!.markupBps,
    )}`

    const lead =
      priced.length === 1
        ? `${named} moves the selling price of `
        : `Changes in ${plural(priced.length, 'group')} move the selling price of `

    // A rename rides along in the second line: the first line is for the thing
    // that costs money, and a rename is not it.
    const alsoRenamed = renamed.length ? `${renameClause}. ` : ''

    // The count travels in the button, so reading only buttons still works —
    // which means a rename going along with the press has to be in there too.
    const applyLabel = renamed.length
      ? `Apply ${plural(renamed.length, 'rename')} · ${plural(affectedCount.value, 'item')}`
      : `Apply to ${plural(affectedCount.value, 'item')}`

    // A group made on this screen holds nothing yet, so its markup moves no
    // price at all. Said as that, rather than as "0 of 0 items".
    if (affectedCount.value === 0) {
      return {
        sentence: {
          lead:
            priced.length === 1 ? `${named} — ` : `Changes in ${plural(priced.length, 'group')} — `,
          count: 'nothing',
          tail: ' to reprice yet.',
        },
        detail: `${alsoRenamed}${EMPTY_GROUP_DETAIL}`,
        applyLabel: renamed.length
          ? `Save ${plural(renamed.length, 'rename')} · ${plural(priced.length, 'markup')}`
          : `Save ${plural(priced.length, 'markup')}`,
      }
    }

    // Zero excluded is never said as "0" — the clause simply is not there.
    const keep = excluded
      ? `${plural(excluded, 'overridden item')} keep their price${excluded === 1 ? '' : 's'}. `
      : ''

    // TODO: the worked example belongs here — `Example: the 2-gang switch goes
    // 373.00 → 410.19`, from the largest affected group. It is rule 3 of the
    // screen: an aggregate count is abstract, a named item is checkable. It is
    // out because naming an item needs an item, and no group-level figure
    // carries one — `GET /groups/details` answers about the group. The source
    // is `GET /items?group_id=`, where `name`, `landed_unit_cost_pesewas` and
    // `selling_price_override_pesewas` are enough to pick an item the markup
    // actually reaches and say what its price would become.
    return {
      sentence: { lead, count, tail: ' items.' },
      detail: `${alsoRenamed}${keep}`.trim(),
      applyLabel,
    }
  })

  // --- making one ------------------------------------------------------------

  /**
   * Whether some other group already answers to this name. Checked two ways,
   * because a rename moves the name and leaves the slug: by the name each row
   * is currently holding — a pending rename counts, or two rows could be made
   * to collide and only fail on the press — and by slug, so a new group cannot
   * be minted onto an existing one's identity.
   *
   * `exceptSlug` is the row doing the asking; a row never collides with itself.
   */
  const nameTaken = (name: string, exceptSlug?: string) => {
    const wanted = settled(name)
    if (!wanted) return false

    const slug = slugify(wanted)
    return groups.value.some((group) => {
      if (group.slug === exceptSlug) return false
      return settled(names[group.slug] ?? group.name) === wanted || group.slug === slug
    })
  }

  /**
   * A new group as `POST /groups` wants it, or null when the name is not one.
   *
   * Group names are a lowercase vocabulary — `lighting`, `switching` — and the
   * slug is lowercase regardless, so the name follows it. The markup is
   * optional: blank means 0 bps, a markup of 1.00, which is the only honest
   * reading of a blank — it sells at cost until he says otherwise.
   */
  function newGroup(name: string, markupText: string) {
    const trimmed = settled(name)
    if (!trimmed || nameTaken(trimmed)) return null

    return {
      name: trimmed,
      default_markup_bps: usable(markupText) ? markupToBps(markupText) : 0,
    }
  }

  // --- what he does to a row -------------------------------------------------

  const setDraft = (slug: string, text: string) => {
    drafts[slug] = sanitise(text)
  }

  /** A name is words: it is taken as typed and tidied when he leaves it. */
  const setName = (slug: string, text: string) => {
    names[slug] = text
  }

  const savedText = (slug: string) => {
    const group = groups.value.find((candidate) => candidate.slug === slug)
    return group ? bpsToMarkup(group.markupBps) : ''
  }

  const savedName = (slug: string) =>
    groups.value.find((candidate) => candidate.slug === slug)?.name ?? ''

  /**
   * Leaving the field says the number back in full. A field left holding
   * nothing usable was never a change, so it goes back to what it was.
   */
  function normalise(slug: string) {
    const text = drafts[slug] ?? ''
    drafts[slug] = usable(text) ? Number(text).toFixed(2) : savedText(slug)
  }

  /**
   * Leaving the name field says the name back in the case the table holds it
   * in. A name left blank was never a rename, so it goes back — that is the
   * undo for an emptied field, and it clears the row's own error with it.
   */
  function normaliseName(slug: string) {
    const wanted = settled(names[slug] ?? '')
    names[slug] = wanted || savedName(slug)
  }

  const revert = (slug: string) => {
    drafts[slug] = savedText(slug)
    names[slug] = savedName(slug)
  }

  const discardAll = () => {
    for (const group of groups.value) {
      drafts[group.slug] = bpsToMarkup(group.markupBps)
      names[group.slug] = group.name
    }
  }

  /**
   * What the press would send: one entry per dirty row, carrying only the
   * halves that moved. Empty while a row's name is not usable — that row holds
   * the whole press, and says why in itself.
   *
   * Nothing settles locally. The rows re-read from the server's answer, so the
   * bar dismisses because the drafts match what came back, not because it was
   * told to — and a write that fails leaves everything he typed where it is.
   */
  const pendingEdits = computed<PendingEdit[]>(() => {
    if (blocked.value) return []

    return dirtyRows.value.map((row) => ({
      id: row.group.id,
      ...(row.rename === null ? {} : { name: row.rename }),
      ...(row.projection === null ? {} : { markupBps: row.projection.markupBps }),
    }))
  })

  return {
    rows,
    dirtyRows,
    affectedCount,
    blocked,
    commit,
    pendingEdits,
    newGroup,
    nameTaken,
    setDraft,
    setName,
    normalise,
    normaliseName,
    revert,
    discardAll,
  }
}
