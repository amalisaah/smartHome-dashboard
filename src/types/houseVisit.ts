/**
 * Module 5, block A — the house's Visit notes tab.
 *
 * The handoff says this screen renders and computes nothing. Where the API can
 * answer, it now does: the fields, the rooms, the counts and the pin's position
 * are all read, and the two writes it makes go to `PATCH /houses/{id}` and
 * `PATCH /rooms/{id}`.
 *
 * Three things the design draws have **no representation on the wire**, and are
 * marked where they appear below rather than filled in with a guess:
 *
 *   1. a pin's **accuracy and time** — `ApiHouse` carries `gps_lat`/`gps_lng`
 *      and nothing about the reading that produced them;
 *   2. a room type that was **guessed** from the name — `space_slug` is
 *      required and has no "and this was inferred" beside it;
 *   3. a room with **no type at all** — `space_slug` is non-nullable, so the
 *      `type?` chip cannot arise from a house the API describes.
 *
 * `ApiInternetQuality` and `ApiSpaceSlug` are reused rather than restated: the
 * values these controls offer are the values the wire has.
 */

import type { ApiInternetQuality, ApiSpaceSlug } from '@/types/api'

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
 * Where he was standing.
 *
 * The position is the record's. The accuracy and the time are the **reading**,
 * and the wire has no column for either: a pin fetched back from the API knows
 * where but not how sure or when. They are therefore nullable, and the row
 * renders what it has rather than inventing a `±8 m` the device never claimed.
 * A pin dropped in this session does carry both, because the browser's
 * `GeolocationPosition` supplies them — until the page is reloaded.
 *
 * ⚠️ FLAG: `ApiHouse.gps_lat` / `gps_lng` only. The design draws
 * `5.7043, −0.1662 · ±8 m · 13:41`; a stored pin can only ever render the first
 * third of that until the house carries an accuracy and a timestamp.
 */
export interface VisitPin {
  lat: number
  lng: number
  /** Metres — `±8 m`. Null for a pin read back from the API. */
  accuracyM: number | null
  /** `13:41`. Null for a pin read back from the API. */
  time: string | null
}

/**
 * Whether a room's type is his or the system's.
 *
 * ⚠️ FLAG: only `confirmed` can arise from the API today. `space_slug` is
 * required and non-nullable, and carries nothing to say it was inferred — so
 * `guessed` (the dashed chip) and `missing` (the risk `type?` chip) have no
 * source. The states stay in the type and in the chip because they are the
 * design and block B needs the same three; what is missing is the column that
 * would set them.
 */
export type RoomTypeState = 'confirmed' | 'guessed' | 'missing'

export interface VisitRoom {
  id: number
  name: string
  /** The space slug, or null for a room with no type — see the FLAG above. */
  type: ApiSpaceSlug | null
  /** Whether `type` was inferred from the name. Always false from the API. */
  guessed: boolean
}

export const roomTypeState = (room: VisitRoom): RoomTypeState =>
  room.type === null ? 'missing' : room.guessed ? 'guessed' : 'confirmed'

/**
 * The slug as he reads it. `living_room` is two words to everyone but the
 * database, and the reference draws it that way.
 */
export const spaceLabel = (slug: ApiSpaceSlug) => slug.replace(/_/g, ' ')

/**
 * The types the chip cycles through, in the order it offers them — the wire's
 * own enum, so a click can only ever produce a value `PATCH /rooms/{id}` will
 * take. `whole_house` is absent because the API rejects it on a room.
 */
export const ROOM_TYPES: readonly ApiSpaceSlug[] = [
  'bedroom',
  'living_room',
  'kitchen',
  'bathroom',
  'corridor',
  'outdoor',
]

/**
 * What one click does, and the whole of it: a guess becomes his, a confirmed
 * type moves on, a blank takes the first. Block B does the rest — renaming,
 * adding, removing, reordering.
 */
export function nextRoomType(room: VisitRoom): VisitRoom {
  if (room.type === null) return { ...room, type: ROOM_TYPES[0], guessed: false }
  // A guess is confirmed by being clicked: the word was already right.
  if (room.guessed) return { ...room, guessed: false }

  const at = ROOM_TYPES.indexOf(room.type)
  // A type from outside the cycle enters it at the top rather than nowhere.
  const next = ROOM_TYPES[at === -1 ? 0 : (at + 1) % ROOM_TYPES.length]
  return { ...room, type: next, guessed: false }
}

/**
 * One line of the offline queue — what is held, and over what span it was
 * typed. Derived from the screen's own unsent writes; see `useVisitNotes`.
 */
export interface HeldItem {
  id: string
  /** `Directions, access, wiring, internet`. */
  label: string
  /** `13:41–13:58`, or a single `14:02`. */
  at: string
}
