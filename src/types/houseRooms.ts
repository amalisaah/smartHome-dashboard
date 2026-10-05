/**
 * Module 5, block B — the house's **Rooms** tab.
 *
 * A room is the same four facts here as it is on Visit notes (`VisitRoom`: an
 * id, his word for it, a type, and whether the type is the system's guess or
 * his). What block B adds is everything *around* one: the name being typed, the
 * guess made for that text, the common names not used yet, and the one removal
 * that can still be taken back.
 *
 * ⚠️ FLAG — two of the four facts have no column on the wire, as block A
 * already records. `POST /houses/{id}/rooms` requires `space_slug`, so a room
 * added as `type?` cannot be created, and nothing on `ApiRoom` says a type was
 * inferred. Those are the two states this whole tab is built around, so the
 * rooms here are held locally (see `@/stores/houseRooms`) rather than written
 * through a shape that cannot carry them.
 */

import type { ApiSpaceSlug } from '@/types/api'
import { ROOM_TYPES, type VisitRoom } from '@/types/houseVisit'

/** A room, as both devices list it. Block B's rooms are block A's rooms. */
export type Room = VisitRoom

/**
 * One of the eight names on the quick row — a name *and* the type that comes
 * with it, because the point of the row is that one tap settles both.
 */
export interface CommonRoomName {
  name: string
  type: ApiSpaceSlug
}

/**
 * The fixed eight, in the drawn order. A name already in the list drops out of
 * the row: the row is for rooms he has not got to, and a house has one Kitchen.
 */
export const COMMON_ROOM_NAMES: readonly CommonRoomName[] = [
  { name: 'Master', type: 'bedroom' },
  { name: 'Kids room', type: 'bedroom' },
  { name: 'Hall', type: 'living_room' },
  { name: 'Kitchen', type: 'kitchen' },
  { name: 'Bathroom', type: 'bathroom' },
  { name: 'Compound', type: 'outdoor' },
  { name: 'Corridor', type: 'corridor' },
  { name: 'Guest room', type: 'bedroom' },
]

/** Names are compared as he would say them, not as he happened to type them. */
export const sameRoomName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * The names still worth offering. Supplied, in the sense that it is a fact
 * about the list rather than a rule: a name he has used is a name he does not
 * need offered.
 */
export const unusedCommonNames = (rooms: readonly Room[]) =>
  COMMON_ROOM_NAMES.filter((common) => !rooms.some((room) => sameRoomName(room.name, common.name)))

/**
 * A second `Bedroom` becomes `Bedroom 2`, a third `Bedroom 3`.
 *
 * It never asks first — asking is a stop, and he is walking through a house.
 * The number is the count of rooms already answering to the name, so removing
 * one and adding another does not reuse a number that is still on screen.
 */
export function uniqueRoomName(rooms: readonly Room[], wanted: string): string {
  const name = wanted.trim()
  if (!rooms.some((room) => sameRoomName(room.name, name))) return name

  let suffix = 2
  while (rooms.some((room) => sameRoomName(room.name, `${name} ${suffix}`))) suffix += 1
  return `${name} ${suffix}`
}

/**
 * What the system thinks a name means, as he types it.
 *
 * ⚠️ FLAG — **this table stands in for a supplied value.** The handoff lists
 * the guess among the things the UI renders and does not compute, and there is
 * no endpoint behind it today. It is a lookup rather than a rule so that
 * replacing it is a deletion: when the guess arrives from somewhere, the screen
 * reads it from there and this file loses a constant.
 *
 * A key matches when the typed text contains it (`Back bedroom` → bedroom) or
 * when the key begins with the typed text (`Compo` → outdoor, which is the
 * state the reference is drawn in). Three characters, because two will match
 * half the table and guess wrongly while he is still on the first syllable.
 */
const GUESSES: readonly [string, ApiSpaceSlug][] = [
  ['master', 'bedroom'],
  ['bedroom', 'bedroom'],
  ['kids room', 'bedroom'],
  ['guest room', 'bedroom'],
  ['boys room', 'bedroom'],
  ['hall', 'living_room'],
  ['living room', 'living_room'],
  ['sitting room', 'living_room'],
  ['lounge', 'living_room'],
  ['kitchen', 'kitchen'],
  ['pantry', 'kitchen'],
  ['bathroom', 'bathroom'],
  ['washroom', 'bathroom'],
  ['toilet', 'bathroom'],
  ['shower', 'bathroom'],
  ['compound', 'outdoor'],
  ['garden', 'outdoor'],
  ['yard', 'outdoor'],
  ['veranda', 'outdoor'],
  ['porch', 'outdoor'],
  ['garage', 'outdoor'],
  ['gate', 'outdoor'],
  ['corridor', 'corridor'],
  ['passage', 'corridor'],
  ['landing', 'corridor'],
  ['stairs', 'corridor'],
]

const MIN_GUESS_CHARS = 3

/** The guess for what is in the field, or null when the name says nothing. */
export function guessRoomType(text: string): ApiSpaceSlug | null {
  const name = text.trim().toLowerCase()
  if (name.length < MIN_GUESS_CHARS) return null

  const hit = GUESSES.find(([key]) => name.includes(key) || key.startsWith(name))
  return hit ? hit[1] : null
}

/**
 * What one tap on a room's type chip does on the phone, and the whole of it.
 *
 * `type?` takes the first type. A guess is confirmed by being tapped — the word
 * was already right, it was only the system that said it. A confirmed type
 * moves to the next and wraps. Shared with block A's card, which is the same
 * chip doing the same thing.
 */
export { nextRoomType } from '@/types/houseVisit'

/** The six, as the chips offer them. Re-exported so block B imports one module. */
export { ROOM_TYPES }

/**
 * A removal that has not been let go of yet. It holds the room *and* where it
 * was, because undo has to put it back in walk order rather than at the end —
 * the order is the walk, and a room that moved to the bottom is a lie about the
 * house.
 */
export interface RemovedRoom {
  room: Room
  at: number
}

/** The three figures under the laptop's list. Facts about the list it is under. */
export interface RoomCounts {
  rooms: number
  guessed: number
  untyped: number
}

export const roomCounts = (rooms: readonly Room[]): RoomCounts => ({
  rooms: rooms.length,
  guessed: rooms.filter((room) => room.type !== null && room.guessed).length,
  untyped: rooms.filter((room) => room.type === null).length,
})
