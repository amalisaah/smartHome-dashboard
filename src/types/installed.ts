/**
 * Module 5, block C — the house's **What's installed** tab.
 *
 * The record a stranger reads a year from now, before touching a switch. Two
 * rules shape every type in this file:
 *
 *   **Counts only.** There is no unit, no serial and no "which one". `1 of 2
 *   faulty` is the whole answer, and nothing here can express a finer one.
 *
 *   **Who wrote it.** Every line says whether a job put it there or a person
 *   did, because that is what tells a later reader how much to trust it. It is
 *   the one piece of provenance the screen carries, and it is drawn as the
 *   system's solid/dashed language rather than as a word.
 *
 * ⚠️ FLAG — this shape is **not** `ApiInstalledDevice`. The wire carries one row
 * per device with a single `status` (`active` | `faulty` | `removed`) and a
 * `quantity`; the design carries one row per device with all three counts at
 * once. Folding one onto the other — deciding that two API rows for the same
 * item in the same room are one line here, and which of their `notes` is the
 * fault and which the removal — is the business rule the handoff says this
 * screen does not own. So the record is read from `@/data/houseRecordMock`
 * until an endpoint answers in these terms. See `@/stores/houseInstalled`.
 */

import type { ApiSpaceSlug } from '@/types/api'

/** Who put a line in the record. Dashed is the system's, solid is his. */
export type WrittenBy = 'job' | 'hand'

/** The three counts a device line carries, and the only three. */
export type CountField = 'active' | 'faulty' | 'removed'

export interface InstalledDevice {
  id: number
  /** The catalogue item's name, as the record names it. */
  name: string
  active: number
  faulty: number
  removed: number
  /**
   * `1 of 2 faulty`. Supplied, and **not** derived from `faulty` and `active`:
   * the reference draws `1 of 2 faulty` on a line whose columns read 2 and 1,
   * so the pill counts something the columns do not. Rendered as given.
   */
  faultPill: string | null
  /** `flickers · reported 22 Sep`. Supplied. */
  faultNote: string | null
  /** `removed 14 Aug · swapped for 16A`. Supplied. */
  removedNote: string | null
  source: WrittenBy
  /** `14 Aug` — the date beside the source, as the chip says it. */
  sourceDate: string
}

export interface InstalledRoom {
  id: number
  name: string
  type: ApiSpaceSlug
  devices: InstalledDevice[]
}

/** Everything the two screens read, for one house. */
export interface InstalledRecord {
  rooms: InstalledRoom[]
  /** `14 Aug` — the last job to write anything here. Supplied. */
  lastJobDate: string
  /** `customer since Aug 2026 · last job 14 Aug`. Supplied. */
  summaryPhrase: string
  /** The three lines above the rooms. Supplied summaries of Visit notes. */
  beforeYouTouch: BeforeYouTouch
}

/** What a fixer needs before touching a switch, in three lines. */
export interface BeforeYouTouch {
  wiring: string
  internet: string
  access: string
}

/**
 * A line nobody has any of any more: it was removed and nothing replaced it.
 * It keeps its room and its strike-through, and it is hidden until asked for.
 */
export const isRemovedOnly = (device: InstalledDevice) =>
  device.active === 0 && device.faulty === 0 && device.removed > 0

/** A room with something wrong in it — the one thing that takes the amber tint. */
export const roomHasFault = (room: InstalledRoom) =>
  room.devices.some((device) => device.faulty > 0)

/**
 * What the room header says after its type: `bedroom · 4 active`.
 *
 * Active and faulty are two columns, not one split in two: the reference's
 * Master reads `4 active` over lines of 2, 1 and 1 while one of its bulbs is
 * also faulty. A faulty unit is counted where the record counts it, and that is
 * the faulty column.
 */
export const roomActive = (room: InstalledRoom) =>
  room.devices.reduce((total, device) => total + device.active, 0)

/** Whether a room has anything at all — removed lines are not "installed". */
export const roomIsEmpty = (room: InstalledRoom) =>
  room.devices.every((device) => device.active === 0 && device.faulty === 0)

export interface InstalledTotals {
  active: number
  faulty: number
  removed: number
}

/**
 * The three figures the toolbar, the tab and the strip read.
 *
 * The handoff calls these supplied, and in the running system they are: the
 * server answers with them after it has written the change. Here they are read
 * off the record the screen is holding, which is the same number arrived at the
 * only way a screen with no server can arrive at it — and it keeps a stepper's
 * answer and the toolbar's total from disagreeing while he is looking at both.
 */
export function installedTotals(rooms: readonly InstalledRoom[]): InstalledTotals {
  const totals = { active: 0, faulty: 0, removed: 0 }
  for (const room of rooms) {
    for (const device of room.devices) {
      totals.active += device.active
      totals.faulty += device.faulty
      totals.removed += device.removed
    }
  }
  return totals
}
