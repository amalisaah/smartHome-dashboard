/**
 * Block C's words, exactly as the handoff writes them.
 *
 * The explainer in particular: it is the sentence that makes a hand-typed count
 * readable by someone who was not there, and it says `by hand` in the same
 * words the chip does. The tag inside it is drawn as a box, so the sentence is
 * split around it rather than carrying markup.
 */

export const BEFORE_YOU_TOUCH = 'Before you touch anything'
export const WIRING_KEY = 'wiring'
export const INTERNET_KEY = 'internet'
export const ACCESS_KEY = 'getting in'

export const NOTHING_INSTALLED = 'Nothing installed'
export const NOTHING_INSTALLED_META = 'nothing installed'

export const CORRECT_BY_HAND = 'Correct by hand'
export const DONE = 'Done'
export const CANCEL = 'Cancel'
export const VISIT_NOTES_LINK = 'Visit notes'

/** `Show 3 removed` / `Hide 3 removed`. */
export const removedToggle = (shown: boolean, count: number) =>
  `${shown ? 'Hide' : 'Show'} ${count} removed`

/** `16 active · 1 faulty` — the faulty half is drawn in risk and weighted. */
export const activeCount = (count: number) => `${count} active`
export const faultyCount = (count: number) => `${count} faulty`

/** `Written by jobs. Last: 14 Aug.` */
export const writtenByJobs = (date: string) => `Written by jobs. Last: ${date}.`

export const INSTALLED_FOOTER_LEGEND =
  'in walk order · dashed = written by a job · solid = by hand · counts only, never which unit'

// --- correcting by hand ------------------------------------------------------

/** The explainer, split around the `by hand` tag that is drawn as a box. */
export const EXPLAINER_BEFORE = 'Changes here are marked'
export const EXPLAINER_TAG = 'by hand'
export const EXPLAINER_AFTER = 'in the record, so a later reader knows no job put them there.'

/** `Hall · by hand` — C2's title. */
export const correctingTitle = (room: string) => `${room} · by hand`

export const COUNT_LABELS = {
  active: 'active',
  faulty: 'faulty',
  removed: 'removed',
} as const

export const CATALOGUE_SEARCH_PHONE = 'Add from catalogue — search'

/** `+ Add to Hall from catalogue — search` */
export const catalogueSearchDesk = (room: string) => `+ Add to ${room} from catalogue — search`

export const COUNTS_ONLY_NOTE =
  'Counts only. There\'s no unit, serial or "which one" — "one of the two in the master" is the whole answer.'

// --- the written-by chip -----------------------------------------------------

/** `job · 14 Aug`, dashed — the system wrote it. */
export const jobChip = (date: string) => `job · ${date}`
/** `by hand · 2 Sep`, solid — he did. */
export const handChip = (date: string) => `by hand · ${date}`

// --- the phone header --------------------------------------------------------

/** `updated by job · 14 Aug` */
export const updatedByJob = (date: string) => `updated by job · ${date}`
/** `offline copy · 14 Aug` */
export const offlineCopy = (date: string) => `offline copy · ${date}`
