/**
 * Module 5, block A — the house's Visit notes tab.
 *
 * The handoff is explicit that this screen renders and computes nothing: the
 * save status, the room and installed counts, the pin's accuracy and time, which
 * room types were guessed, the offline queue and the visit summary phrase are
 * all **supplied**. Nothing in this file is a rule — it is the shape of an
 * answer the screen is given.
 *
 * `ApiInternetQuality` is reused rather than restated: the four values the
 * segmented control offers are the four the wire already has, in the order a
 * visit answers the question.
 */

import type { ApiInternetQuality } from '@/types/api'

/** The four fixed values, in the order the control draws them. */
export const INTERNET_VALUES = ['reliable', 'weak', 'none', 'unknown'] as const

export const INTERNET_SEGMENTS: { label: string; value: ApiInternetQuality }[] =
  INTERNET_VALUES.map((value) => ({ label: value, value }))

/**
 * What he types. Six fields, in the order he meets them walking the house —
 * which is also the order they are drawn, because the scroll is the walk.
 *
 * The pin is not here: it is dropped, not typed, and it is the one thing on the
 * screen the laptop cannot set.
 */
export interface VisitNotesDraft {
  /** The big field, and the first on screen. */
  directions: string
  /** Optional, never primary. */
  address: string
  access: string
  wiring: string
  internet: ApiInternetQuality
  internetNote: string
}

export const blankVisitNotes = (): VisitNotesDraft => ({
  directions: '',
  address: '',
  access: '',
  wiring: '',
  internet: 'unknown',
  internetNote: '',
})

/**
 * Where he was standing. Supplied whole — the accuracy and the time come off the
 * device that took the reading, and no later screen can recover them.
 */
export interface VisitPin {
  lat: number
  lng: number
  /** Metres. Rendered `±8 m`. */
  accuracyM: number
  /** `13:41`, as the phone read the clock when the pin was dropped. */
  time: string
}

/**
 * Whether a room's type is his or the system's.
 *
 * `guessed` is supplied — this screen is never told the rule that guessed it and
 * must not infer one from the name. It is the only thing on block A drawn
 * dashed, and the dashes go the moment he confirms it.
 */
export type RoomTypeState = 'confirmed' | 'guessed' | 'missing'

export interface VisitRoom {
  id: number
  name: string
  /** `bedroom`, or null when nothing has been said about it. */
  type: string | null
  /** Supplied: whether `type` was guessed from the name rather than chosen. */
  guessed: boolean
}

export const roomTypeState = (room: VisitRoom): RoomTypeState =>
  room.type === null ? 'missing' : room.guessed ? 'guessed' : 'confirmed'

/** One line of the offline queue — what is held, and when it was typed. */
export interface HeldItem {
  id: string
  /** `Directions, access, wiring, internet`. */
  label: string
  /** `13:41–13:58`, or a single `14:02`. Supplied, already formatted. */
  at: string
}

/**
 * Everything the screen is handed beside the draft itself. One shape, because
 * every field in it arrives from somewhere this handoff does not specify, and
 * grouping them is what makes that visible at the call site.
 */
export interface VisitContext {
  /** `Efua Mensah` — the header's way back, and never the address. */
  customerName: string
  roomCount: number
  installedCount: number
  pin: VisitPin | null
  rooms: VisitRoom[]
  /** `visited 30 Sep · 13:41–14:02 · on phone` — a phrase, not parts. */
  visitSummary: string
  /** What the offline banner counts: `4 notes and 6 rooms are on this phone.` */
  heldNoteCount: number
  heldRoomCount: number
  held: HeldItem[]
}

/**
 * The room types the A3 chip cycles through, in the order it offers them.
 *
 * Fixed here rather than fetched because the chip has to answer a click with the
 * next one immediately, and because block B owns everything else about a room.
 * A type the API knows that is not in this list still renders — it is only the
 * cycle that is closed.
 */
export const ROOM_TYPES = [
  'bedroom',
  'living room',
  'kitchen',
  'bathroom',
  'office',
  'outside',
] as const

/**
 * What one click does, and the whole of it: a guess becomes his, a confirmed
 * type moves on, a blank takes the first. Block B does the rest — renaming,
 * adding, removing, reordering.
 */
export function nextRoomType(room: VisitRoom): VisitRoom {
  if (room.type === null) return { ...room, type: ROOM_TYPES[0], guessed: false }
  // A guess is confirmed by being clicked: the word was already right.
  if (room.guessed) return { ...room, guessed: false }

  const at = (ROOM_TYPES as readonly string[]).indexOf(room.type)
  // A type from outside the cycle enters it at the top rather than nowhere.
  const next = ROOM_TYPES[at === -1 ? 0 : (at + 1) % ROOM_TYPES.length]
  return { ...room, type: next, guessed: false }
}
