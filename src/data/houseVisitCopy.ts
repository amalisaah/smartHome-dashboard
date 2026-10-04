/**
 * Block A's words, exactly as the handoff writes them.
 *
 * They are in one file because the handoff says "use the exact strings in the
 * reference" and because the labels are in *his* words — `as you'd tell a
 * driver`, `Wiring — the neutral` — which is the kind of thing a later edit
 * quietly improves into something nobody says out loud.
 */

/** The four blocks, in the order he meets them walking the house. */
export const BLOCKS = {
  finding: { index: '01', title: 'Finding it' },
  access: { index: '02', title: 'Getting in' },
  wiring: { index: '03', title: 'Wiring — the neutral' },
  internet: { index: '04', title: 'Internet' },
} as const

export const DIRECTIONS_LABEL = "Directions — as you'd tell a driver"
export const ADDRESS_LABEL = 'Address, if there is one'
export const ADDRESS_PLACEHOLDER = 'Plot, street, area'

/**
 * Why the block is boxed, said in the block. The laptop shortens it because the
 * gutter it sits in is 160px wide and he has already read it once on the phone.
 */
export const WIRING_HELPER_PHONE =
  'Decides whether smart switches are possible. Open a box, then write what you saw.'
export const WIRING_HELPER_DESK = 'Decides whether smart switches are possible.'

/**
 * A chip types its words into the textarea above it and does nothing else — no
 * flag, no structured field. `text` is what is inserted; the `+` is the chip's
 * label saying it adds, and is not part of the value.
 */
export interface PhraseChip {
  text: string
}

export const ACCESS_PHRASES: PhraseChip[] = [
  { text: 'dog' },
  { text: 'gate locked' },
  { text: 'security man' },
  { text: 'call first' },
]

export const WIRING_PHRASES: PhraseChip[] = [
  { text: 'no neutral' },
  { text: 'neutral present' },
  { text: "didn't open boxes" },
]

// --- the pin ---------------------------------------------------------------

export const PIN_SET_TITLE = 'Pinned at the gate'
export const PIN_DROP = "Drop a pin where I'm standing"
export const PIN_DROP_OPTIONAL = 'optional'
export const PIN_FINDING = 'Finding you…'
/** Shown under the button when the browser says no, or says nothing. */
export const PIN_FAILED = "Couldn't get a location — directions are enough."
export const PIN_NONE_DESK = 'No pin — dropped from the phone, at the gate'

// --- the footer ------------------------------------------------------------

/** Two lines, and drawn as two: the break is the design, not a wrap. */
export const FOOTER_LINES = ['Every keystroke kept', 'on this phone'] as const
export const WALK_THE_ROOMS = 'Walk the rooms →'

// --- offline ---------------------------------------------------------------

export const OFFLINE_STATUS = 'no signal · held on phone'
export const OFFLINE_TITLE = 'Keep going — nothing needs the network'

/**
 * The reassurance, with the two supplied counts in it. A function rather than a
 * template because the counts are the only part of it this screen is given, and
 * the rest must not drift.
 */
export const offlineReassurance = (notes: number, rooms: number) =>
  `${notes} notes and ${rooms} rooms are on this phone. They send themselves when signal comes back. ` +
  'Closing the app, a call, a flat battery at 3% — none of it loses them.'

export const WAITING_TO_SEND = 'Waiting to send'
export const BACK_ONLINE = 'Back online — all sent.'

// --- the laptop's right column ---------------------------------------------

export const EDIT_ROOMS = 'Edit rooms'
export const ROOMS_CAPTION =
  'Dashed = guessed from the name. Click to confirm; click again to change.'
export const NOTHING_INSTALLED = 'Nothing installed yet.'
export const OPEN_INSTALLED = 'Open installed'
export const OPEN_MAP = 'Open map'
export const UNTYPED_ROOM = 'type?'
