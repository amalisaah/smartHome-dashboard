import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import {
  QUOTE_LIST_TABS,
  isQuoteListTab,
  quoteRowMatches,
  type QuoteListRow,
  type QuoteListTab,
  type QuoteListTabDef,
} from '@/types/quoteList'
import { isString, sessionValue } from '@/utils/storage'

/**
 * The tab he last worked in, for the tab's lifetime — and the search with it.
 * Opening a quote and coming back has to land him on the list he left, which is
 * both: a half-typed name he has to type again is the same list to him and a
 * different one to the screen.
 *
 * It opens on **Waiting** when there is nothing stored, because that is the
 * question the screen exists to answer.
 */
const storedTab = sessionValue<QuoteListTab>('quotes:tab', isQuoteListTab)
const storedQuery = sessionValue<string>('quotes:query', isString)

export interface QuoteListColumn {
  def: QuoteListTabDef
  /** Every row in this state, whatever the search says. The header's figure. */
  total: number
  /** What the search left. */
  rows: QuoteListRow[]
}

/**
 * Which rows are on screen, in which state, under what search.
 *
 * It owns no requests: the view fetches and hands the rows in, so a refetch
 * arrives as new input rather than as a second source of truth. It sorts
 * nothing either — the row order inside each state is supplied, and re-sorting
 * here would quietly disagree with the server about which quote is oldest.
 *
 * One search box drives both devices. The phone filters the tab he is looking
 * at; the laptop filters all three columns at once and the header counts stay
 * at the **unfiltered** totals, so searching never looks like quotes have gone
 * missing.
 */
export function useQuoteList(rowsSource: MaybeRefOrGetter<QuoteListRow[]>) {
  const rows = computed(() => toValue(rowsSource))

  const query = ref(storedQuery.readOr(''))
  const tab = ref<QuoteListTab>(storedTab.readOr('waiting'))

  watch(query, (value) => storedQuery.write(value))
  watch(tab, (value) => storedTab.write(value))

  /** Every row of a state, before the search. The figure a header shows. */
  const totals = computed<Record<QuoteListTab, number>>(() => {
    const counts = { waiting: 0, drafts: 0, answered: 0 }
    for (const row of rows.value) {
      for (const def of QUOTE_LIST_TABS) {
        if (def.holds(row)) counts[def.id] += 1
      }
    }
    return counts
  })

  /** The three columns the laptop draws, left to right in the order he acts. */
  const columns = computed<QuoteListColumn[]>(() =>
    QUOTE_LIST_TABS.map((def) => ({
      def,
      total: totals.value[def.id],
      rows: rows.value.filter((row) => def.holds(row) && quoteRowMatches(row, query.value)),
    })),
  )

  const activeTab = computed(
    () => QUOTE_LIST_TABS.find((def) => def.id === tab.value) ?? QUOTE_LIST_TABS[0],
  )

  /** The phone's list: the tab he is on, filtered. */
  const phoneRows = computed(() =>
    rows.value.filter((row) => activeTab.value.holds(row) && quoteRowMatches(row, query.value)),
  )

  /**
   * `7 waiting on her · oldest sent 34 days ago`.
   *
   * Derived from the rows rather than supplied as a string, so it cannot
   * disagree with the column beneath it. The reference writes `days` whatever
   * the number; a single day says `day`, which is the rule the row label itself
   * is drawn with.
   */
  const summary = computed(() => {
    const waiting = rows.value.filter((row) => row.status === 'sent')
    if (!waiting.length) return 'Nothing waiting on her'
    const oldest = waiting.reduce((max, row) => Math.max(max, row.daysWaiting ?? 0), 0)
    const unit = oldest === 1 ? 'day' : 'days'
    return `${waiting.length} waiting on her · oldest sent ${oldest} ${unit} ago`
  })

  /** `No waiting quote matches "spin".` — the tab named in lowercase. */
  const phoneEmptyText = computed(() =>
    query.value.trim()
      ? `No ${activeTab.value.label.toLowerCase()} quote matches “${query.value.trim()}”.`
      : // The full catalogue of empty states is pending with catalogue E; this
        // copy is the handoff's placeholder and is meant to be replaced.
        'Nothing here.',
  )

  const columnEmptyText = (column: QuoteListColumn) =>
    query.value.trim()
      ? `Nothing matches “${query.value.trim()}”.`
      : `Nothing in ${column.def.columnLabel.toLowerCase()}.`

  return {
    query,
    tab,
    activeTab,
    totals,
    columns,
    phoneRows,
    summary,
    phoneEmptyText,
    columnEmptyText,
  }
}
