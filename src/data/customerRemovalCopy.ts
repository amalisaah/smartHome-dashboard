/**
 * Module 5, block F — the words on the two exits and in their confirmations.
 *
 * **Display copy only.** None of it defines what anonymise or delete do; the
 * handoff is explicit that this is what the UI renders and not what happens. It
 * lives here rather than in the components so the two Goes / Stays lists can be
 * read side by side in one file, which is the whole point of the design: the
 * difference between the exits is read across a row.
 *
 * The figures inside the sentences — `2 quotes, 1 job`, `Customer #0141`,
 * `August` — are supplied, so every string below is built from them.
 */

import { firstName } from '@/types/customerDetail'
import type {
  AnonymiseCopy,
  CopyLine,
  DeleteCost,
  RemovalExit,
  RemovalFigures,
} from '@/types/customerDetail'

const plain = (text: string): CopyLine => [{ text }]
const strong = (text: string): CopyLine => [{ text, strong: true }]
const quiet = (text: string): CopyLine => [{ text, quiet: true }]

/**
 * The left exit. Its Stays column is the full one — that is what the reader is
 * meant to see first when the two are compared.
 */
export const anonymiseExit = (name: string, figures: RemovalFigures): RemovalExit => ({
  title: 'Anonymise',
  subline: 'She disappears. Your books stay whole.',
  goes: [
    plain('Name, phone'),
    plain('Directions, address, pin'),
    plain('Getting-in notes'),
    plain('Contact notes'),
  ],
  stays: [
    plain(figures.records),
    plain('Payments against them'),
    plain('What was installed'),
    quiet(`as "${figures.anonymousLabel}"`),
  ],
  button: `Anonymise ${firstName(name)}…`,
})

/**
 * The right exit, on the same grid. Its Goes column opens by pointing at the
 * other card — "Everything on the left" — and its Stays column is one word.
 */
export const deleteExit = (figures: RemovalFigures): RemovalExit => ({
  title: 'Delete permanently',
  subline: 'She and every record attached to her are destroyed.',
  goes: [
    plain('Everything on the left'),
    strong(figures.records),
    strong('Payments against them'),
    plain('What was installed'),
  ],
  stays: [
    strong('Nothing.'),
    quiet(`${figures.month}'s job vanishes from your accounts. No undo.`),
  ],
  button: 'Delete everything…',
})

/** The anonymise dialog's body, with the label it leaves behind set apart. */
export const anonymiseBody = (figures: RemovalFigures): AnonymiseCopy => ({
  before: `Her name, phone, directions and notes are erased. Her ${figures.records} and its payments stay, under `,
  label: figures.anonymousLabel,
  after: '. This can’t be reversed — the details are gone, not hidden.',
})

/**
 * What delete costs, counted. Three lines: what goes, what goes with it, and the
 * month it leaves a hole in — amounts never appear, only counts.
 */
export const deleteCost = (figures: RemovalFigures): DeleteCost => ({
  lines: [
    [...sentenceCounts(figures.recordCounts), { text: ' will be destroyed,' }],
    plain('with the payments recorded against them.'),
    quiet(`Your ${figures.month} figures will be missing this job.`),
  ],
})

/**
 * The supplied counts spoken rather than listed — `2 quotes` and `1 job`, each
 * bold, the joins between them not. Punctuation only; it adds nothing up.
 */
function sentenceCounts(counts: readonly string[]): CopyLine {
  return counts.flatMap((count, index) => {
    const join =
      index === 0 ? '' : index === counts.length - 1 ? ' and ' : ', '
    const parts: CopyLine = join ? [{ text: join }] : []
    return [...parts, { text: count, strong: true }]
  })
}

export const removalBandHeading = 'If she asks to be removed'
export const removalBandSubline = 'Two different things. Read what stays.'

export const deleteSwapLead = 'If she only wants her details gone, '
export const deleteSwapLink = 'anonymise instead'

export const houseAside = 'The address and directions live inside the house, not here.'
