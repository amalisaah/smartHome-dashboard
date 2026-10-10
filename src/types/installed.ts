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
 * ⚠️ This shape is **not** `ApiInstalledDevice`. The wire carries one row per
 * item per room per status, each with its own `quantity`; a line here carries
 * all three counts at once. The fold between them is in
 * `@/utils/mapper/installedMapper`, and it is the one business rule this module
 * had to settle for itself — see that file for what it decides and why.
 */

import type { ApiSpaceSlug } from '@/types/api'

/** Who put a line in the record. Dashed is the system's, solid is his. */
export type WrittenBy = 'job' | 'hand'

/** The three counts a device line carries, and the only three. */
export type CountField = 'active' | 'faulty' | 'removed'

/**
 * The wire rows behind one line, by status.
 *
 * A line is a fold of up to three rows — the same catalogue item in the same
 * room, once per status — and correcting a count means moving units between
 * them. Null is "no row of that status exists yet", which is a different thing
 * from a row holding zero: the wire has no row holding zero.
 */
export interface DeviceRows {
  active: number | null
  faulty: number | null
  removed: number | null
}

export interface InstalledDevice {
  /**
   * `r4-i12` — the room and the catalogue item, which is what makes a line a
   * line. Not a row id: a line is up to three rows and none of them is the one
   * the screen is about.
   */
  id: string
  /** The catalogue item, which is what the fold groups by. */
  itemId: number
  /** Null for the whole-house group, which belongs to no room. */
  roomId: number | null
  /** The wire rows this line was folded from. */
  rows: DeviceRows
  /** The catalogue item's name, as the record names it. */
  name: string
  active: number
  faulty: number
  removed: number
  /** `1 of 2 faulty` — how many of the units on the wall are broken. */
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
  /** Null for the whole-house group — equipment that belongs to no room. */
  id: number | null
  name: string
  /**
   * Null for the whole-house group. The handoff says a house has no
   * "whole house" room and the Rooms tab offers none; the record still has
   * equipment that sits in no room, and hiding it would make the record lie
   * about what is on the wall. See `WHOLE_HOUSE_ROOM`.
   */
  type: ApiSpaceSlug | null
  devices: InstalledDevice[]
}

/** What the whole-house group is called where it has to be called something. */
export const WHOLE_HOUSE_ROOM = 'Whole house'

/** Everything the two screens read, for one house. */
export interface InstalledRecord {
  rooms: InstalledRoom[]
  /**
   * `14 Aug` — the last job to write anything here, or null when no job has.
   *
   * ⚠️ Every row this API has returned so far carries `job_id: null`, so in
   * practice nothing here has been written by a job yet and the footer has no
   * date to give.
   */
  lastJobDate: string | null
  /** The three lines above the rooms, off the house's own notes. */
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
 * `active` is everything on the wall, the broken ones included — see the
 * mapper. So the header is the sum of the column, and a room with one faulty
 * bulb still has that bulb in its total, because it is still up there.
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
 * The handoff calls these supplied, and in a system with a jobs module they
 * would be: the server would answer with them after writing the change. There
 * is no such figure on this API, so they are summed off the record the screen
 * is holding — which also keeps a stepper's answer and the toolbar's total from
 * disagreeing while he is looking at both.
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
