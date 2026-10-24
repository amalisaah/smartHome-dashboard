/**
 * Block G's words, exactly as the handoff writes them — and, for the two states
 * it leaves undrawn, in the same voice.
 *
 * Same reason blocks A and B have a file like this: the strings are the design,
 * and a later edit quietly improves `no rooms yet · can't quote` into something
 * that explains rather than states.
 */

export const STEP_ONE_TITLE = "Who's it for?"
export const STEP_TWO_TITLE = 'Which house?'
export const DIALOG_TITLE = 'New quote'

/** The laptop's two numbered column heads. The phone numbers nothing. */
export const COLUMN_ONE_TITLE = "1 · Who's it for?"
export const COLUMN_TWO_TITLE = '2 · Which house?'

export const SEARCH_PLACEHOLDER = 'Name, phone or area'
export const SEARCH_LABEL = 'Search customers by name, phone or area'

export const CANCEL = 'Cancel'
export const NEW_CUSTOMER = '+ New customer'
export const NEW_HOUSE = '+ New house'
export const ADD_ROOMS = 'Add rooms ›'

/** Under `Which house?`, on both devices. The laptop prefixes her name. */
export const ROOMS_COME_FROM_THE_HOUSE = "The quote's rooms come from the house."

/** The laptop's right column before he has picked anybody. */
export const PICK_A_CUSTOMER_FIRST = 'Pick a customer on the left first.'

/** `Mensah. The quote's rooms come from the house.` */
export const housesSubline = (name: string) => `${name}. ${ROOMS_COME_FROM_THE_HOUSE}`

/** The house row that cannot be picked. */
export const NO_ROOMS_YET = "no rooms yet · can't quote"

/**
 * The phone names her, because she is the sheet's whole subject and the row
 * that would have said so is the row that is missing. The laptop does not: her
 * name is already on the selected row two inches to the left.
 */
export const noHousesPhone = (name: string) =>
  `${name} has no house yet. Add it and walk the rooms first.`

export const NO_HOUSES_DESK = 'No house yet. Add it and walk the rooms first.'

/** `No customer matches "spin". Add her below.` — the phone's footer is there. */
export const noMatchPhone = (query: string) =>
  `No customer matches “${query}”. Add her below.`

export const noMatchDesk = (query: string) => `No customer matches “${query}”.`

// --- the two states the handoff does not draw --------------------------------

/**
 * Offline. The customer list still stands — it is whatever last loaded, and
 * that is the stated behaviour everywhere else on this surface — so this says
 * what cannot be done rather than taking the screen away. The house rows go
 * inert behind it.
 */
export const OFFLINE = "No signal — a quote can't be started until you're back on."

/**
 * The create failed. The sheet stays open on the house step with his customer
 * and his houses still on it: nothing was created, so there is nothing to undo
 * and nothing to warn him about — only the one house to press again.
 */
export const CREATE_FAILED = "That didn't save. Try the house again."

/**
 * The two things a customer row can be doing instead of showing her houses.
 * Both stand in the row he touched, in place of its meta, because that is the
 * thing he is waiting on — the one wait in this flow and the one write.
 */
export const READING_ROOMS = 'reading rooms…'
export const STARTING = 'starting…'

/** The loading and failure of the customer list itself. */
export const LIST_FAILED = "The customers can't be loaded right now."
export const TRY_AGAIN = 'Try again'
