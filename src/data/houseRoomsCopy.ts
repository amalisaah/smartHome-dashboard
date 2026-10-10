/**
 * Block B's words, exactly as the handoff writes them.
 *
 * Same reason block A has a file like this: the strings are the design, they
 * are in his words rather than the product's, and a later edit quietly improves
 * `Add a room he missed — return to add` into something nobody says out loud.
 */

export const ROOM_FIELD_PLACEHOLDER = 'Next room — e.g. Back bedroom'
export const ROOM_FIELD_ADD = 'Add'
export const ROOM_FIELD_LABEL = 'Next room'

/** The laptop's add row — the same field, in a sentence about having missed one. */
export const ROOM_ADD_PLACEHOLDER = 'Add a room he missed — return to add'

export const REMOVE_ROOM = 'Remove room'
export const ADD_ROOM = 'Add room'
export const UNDO = 'Undo'

/** `Removed "Back bedroom"` — the undo strip's left half. */
export const removedRoomLabel = (name: string) => `Removed "${name}"`

// --- the laptop's table ------------------------------------------------------

export const ROOMS_COLUMN_INDEX = '#'
export const ROOMS_COLUMN_NAME = 'Room — his word for it'
export const ROOMS_COLUMN_TYPE = 'Type'

/** The right half of the footer line. The left half is the counts. */
export const ROOMS_FOOTER_LEGEND = 'in walk order · solid = he set it · dashed ? = guessed'

/** `6 rooms · 1 guessed · 0 type?` */
export const roomsFooterCounts = (rooms: number, guessed: number, untyped: number) =>
  `${rooms} ${rooms === 1 ? 'room' : 'rooms'} · ${guessed} guessed · ${untyped} type?`

// --- the laptop's right column ----------------------------------------------

export const FROM_THE_VISIT = 'From the visit'
export const EDIT_VISIT_NOTES = 'Edit visit notes'
export const WIRING_LABEL = 'Wiring — the neutral'
export const INTERNET_LABEL = 'Internet'

// --- B2, the interruptions ---------------------------------------------------

export const RESUME_TITLE = 'Picked up where you left off'

/**
 * The resume sentence, with the time he stopped and the words still in the box.
 *
 * ⚠️ The cause is the handoff's and not the screen's: nothing here knows it was
 * a call. The copy is final and reads better than any hedge the screen could
 * write for itself, so it is kept and the two facts in it are real.
 */
export const resumeCopy = (at: string, text: string) =>
  `You took a call at ${at}. "${text}" was still in the box — it's there, keyboard up.`

/** `2 rooms still say "type?"` */
export const untypedTitle = (count: number) =>
  `${count} ${count === 1 ? 'room' : 'rooms'} still say "type?"`

/** `"Boys quarters" and "Store". They're saved — tag them now or from the laptop tonight.` */
export function untypedCopy(names: readonly string[]): string {
  const quoted = names.map((name) => `"${name}"`)
  const listed =
    quoted.length <= 1
      ? (quoted[0] ?? '')
      : `${quoted.slice(0, -1).join(', ')} and ${quoted[quoted.length - 1]}`
  return `${listed}. They're saved — tag them now or from the laptop tonight.`
}

// --- the phone header --------------------------------------------------------

/** `saved · 6 rooms` — online, with everything kept. */
export const savedRoomsStatus = (count: number) =>
  `saved · ${count} ${count === 1 ? 'room' : 'rooms'}`

/** `6 rooms held on phone` — no signal, and nothing lost. */
export const heldRoomsStatus = (count: number) =>
  `${count} ${count === 1 ? 'room' : 'rooms'} held on phone`
