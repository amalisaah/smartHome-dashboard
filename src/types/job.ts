/**
 * Block C's view model — recording the job.
 *
 * He sits at a desk at about 9pm, after the fit-out. The job was created when
 * she accepted, and most lines went in as quoted, so this screen is for
 * **correcting, not entering**: he changes the few things that were different,
 * checks the money, and completes the job.
 *
 * Owner-only, so there is no customer-facing counterpart and no audience band —
 * the cost column and the profit card say things no customer may see.
 */

import type { ApiJobCostSource, ApiJobStatus, ApiJobType } from '@/types/jobApi'

/**
 * What completing the job does to her house record. Not decoration: the four
 * are four different writes, which is why this is four tiles and not a
 * dropdown — a dropdown hides the consequence behind a click.
 */
export interface JobTypeChoice {
  value: ApiJobType
  name: string
  /** The half-line under the name, inside the tile. */
  short: string
  /**
   * What completing will do, said in full. `{n}` is the device count, which
   * moves as he corrects the Fitted figures — the sentence is about the job as
   * it stands now, not as it was quoted.
   */
  consequence: (devices: number) => string
}

export const JOB_TYPES: readonly JobTypeChoice[] = [
  {
    value: 'install',
    name: 'Install',
    short: 'adds to her house',
    consequence: (n) =>
      `Completing adds these ${n} devices to her house record, in the rooms shown. Use this for a first fit-out.`,
  },
  {
    value: 'upgrade',
    name: 'Upgrade',
    short: 'adds beside what’s there',
    consequence: (n) =>
      `Completing adds these ${n} devices alongside what she already has. Nothing already on her record is touched.`,
  },
  {
    value: 'repair',
    name: 'Repair',
    short: 'swaps one out',
    consequence: () =>
      'Completing takes the replaced units off her house record and puts these in the same rooms. Her device count stays the same.',
  },
  {
    value: 'relocation',
    name: 'Relocation',
    short: 'moves one',
    consequence: () =>
      'Completing moves devices already on her record to the rooms shown. Nothing new is added to her house.',
  },
]

/**
 * What the day did to one line, as a chip.
 *
 * `missing` is the only one in risk ink: it is the line she did not get. The
 * other three are corrections he made, and a correction is not a warning.
 */
export type JobChangeKind = 'delta' | 'swapped' | 'added' | 'missing'

export interface JobChange {
  kind: JobChangeKind
  /** `+2`, `−1`, `swapped`, `added`, `not fitted`. */
  label: string
}

/** One row of the lines table. */
export interface JobLineRow {
  id: number
  /** The room group this row sits under. Whole-house equipment has none. */
  room: string
  itemName: string
  /** The item the quote named, on a swap. Null otherwise. */
  quotedItemName: string | null
  need: string
  /** Null when the quote never had this line — the column reads `—`. */
  quotedQuantity: number | null
  /** What was fitted. The one figure on this screen he types. */
  fitted: number
  /** Null when nothing differs; the chip is drawn only when there is one. */
  change: JobChange | null
  /** fitted × unit selling price, in pesewas. */
  chargedPesewas: number
  /** OWNER-ONLY. fitted × unit landed cost, in pesewas. */
  costPesewas: number
  note: string
  /** Kept so an edit can recompute the two figures without a round trip. */
  unitSellingPricePesewas: number
  unitLandedCostPesewas: number
}

/** Lines under the room they went in, in the order the job records them. */
export interface JobRoomGroup {
  room: string
  rows: JobLineRow[]
}

/** One payment she has made. */
export interface JobPaymentRow {
  id: number
  /** `3 Oct`. */
  paidOn: string
  method: string
  /** `MTN 7781`, or null when she paid in a way that leaves no reference. */
  reference: string | null
  amountPesewas: number
}

/** One thing the day cost him beyond the devices. */
export interface JobCostRow {
  id: number
  label: string
  source: ApiJobCostSource
  /** A photo of the receipt is attached. */
  hasReceipt: boolean
  amountPesewas: number
}

/** The owner's money, straight off `/summary`. Nothing here is computed. */
export interface JobMoney {
  profitPesewas: number
  /** What she owes — the figure the Charged field edits. */
  chargedPesewas: number
  costTotalPesewas: number
  deviceCostPesewas: number
  miscActualPesewas: number
  miscEstimatePesewas: number
  /** Actual misc minus the estimate. */
  miscDeltaPesewas: number
  receivedPesewas: number
  owedPesewas: number
  balanceState: 'unpaid' | 'part_paid' | 'settled' | 'overpaid'
  /** Null on a job with no quote; then the variance line is not drawn. */
  expectedProfitPesewas: number | null
  profitVariancePesewas: number | null
}

/** The whole screen. */
export interface JobRecord {
  id: number
  /** `0098` — how he says the number out loud. */
  number: string
  /** The household, as the header names it: `Adjei, East Legon`. */
  household: string
  /** `0142`, or null for a callout with no quote behind it. */
  quoteNumber: string | null
  quoteId: number | null
  /** `accepted 2 Oct at GH₵ 7,500`, already phrased. Null with no quote. */
  acceptedLine: string | null
  status: ApiJobStatus
  jobType: ApiJobType
  /** What was agreed on the quote, which the job's own figure started as. */
  quoteAgreedPesewas: number | null
  groups: JobRoomGroup[]
  payments: JobPaymentRow[]
  costs: JobCostRow[]
  money: JobMoney
}

/**
 * Which rows the table shows. A **view** of the same lines, not a fact about
 * the job — so it rides in a track, and it is not persisted: he opens this
 * screen to correct four lines, and it should open on them every time.
 */
export type JobLinesView = 'differences' | 'all'

/**
 * Everything the screen is read-only for.
 *
 * `completed` is the designed one: the record is made, and there is no reopen
 * (gap D1) — a line recorded wrong means cancelling and re-recording. A
 * `cancelled` job is read-only for the same reason and says so in its chip.
 *
 * `scheduled` is **not** here. The API's lifecycle starts there and `/start`
 * moves off it, but a job he is recording at 9pm is the same screen whether or
 * not anyone pressed Start, and the API takes the line edits either way. Only
 * the chip's word changes.
 */
export const isReadOnly = (status: ApiJobStatus) =>
  status === 'completed' || status === 'cancelled'

/** How a status reads in the header chip. */
export const STATUS_LABEL: Record<ApiJobStatus, string> = {
  scheduled: 'scheduled',
  in_progress: 'in progress',
  completed: 'completed',
  cancelled: 'cancelled',
}
