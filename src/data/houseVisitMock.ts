import type { VisitContext } from '@/types/houseVisit'

/**
 * ⚠️ MOCK — everything block A is *handed* rather than told.
 *
 * TODO(api): replace each of these as its endpoint lands. None of them exists
 * today, and none of them can be computed from what does:
 *
 *   rooms, roomCount      → `GET /houses/{id}/composition`. The room's `guessed`
 *                           flag has no column on the wire at all; the handoff
 *                           says the type is guessed from the name and says
 *                           nothing about where that guess is made, so this
 *                           screen is told, never decides.
 *   installedCount        → `GET /houses/{id}/installed-devices`.
 *   pin.accuracyM, .time  → the device reading that dropped it. `ApiHouse`
 *                           carries `gps_lat` / `gps_lng` and neither of these,
 *                           so a pin read back from the API has a position and
 *                           no provenance — see `toVisitPin`.
 *   visitSummary          → there is no visit record yet. `30 Sep · 13:41–14:02
 *                           · on phone` is a phrase about a thing that is not
 *                           modelled, and it is supplied as a phrase.
 *   held, heldNoteCount,  → the offline queue. What is held and since when is a
 *   heldRoomCount           property of the sync layer this handoff excludes.
 *
 * Shaped and valued exactly as the reference draws it, so A1, A2 and A3 can be
 * compared against it frame for frame. Swapping any line for a request changes
 * nothing above `VisitContext`.
 */
export const visitContextMock: Omit<VisitContext, 'customerName'> = {
  roomCount: 5,
  installedCount: 0,
  pin: { lat: 5.7043, lng: -0.1662, accuracyM: 8, time: '13:41' },
  rooms: [
    { id: 1, name: 'Master', type: 'bedroom', guessed: false },
    { id: 2, name: 'Kids room', type: 'bedroom', guessed: false },
    { id: 3, name: 'Back bedroom', type: 'bedroom', guessed: false },
    { id: 4, name: 'Hall', type: 'living room', guessed: false },
    // The one guessed type in the snapshot, and the only dashed thing on A3.
    { id: 5, name: 'Kitchen', type: 'kitchen', guessed: true },
  ],
  visitSummary: 'visited 30 Sep · 13:41–14:02 · on phone',
  heldNoteCount: 4,
  heldRoomCount: 6,
  held: [
    { id: 'notes', label: 'Directions, access, wiring, internet', at: '13:41–13:58' },
    { id: 'rooms', label: '6 rooms', at: '14:02' },
    { id: 'pin', label: 'GPS pin', at: '13:41' },
  ],
}

/**
 * ⚠️ MOCK — the house itself, for when the API cannot be reached.
 *
 * The five text fields and the internet value are real: they are columns on
 * `ApiHouse` and the screen reads them. This is only what stands in their place
 * so the frame can be seen without a backend, and it is the reference's own
 * copy so what is seen is the drawing.
 */
export const visitNotesMock = {
  directions:
    'From Adenta barrier, first left after the Total station. Third house past the junction — blue gate, mango tree in front.',
  address: '',
  access:
    'Dog in the compound — ask her to tie it. Security man at the gate till 6pm. Best after 4pm on weekdays.',
  wiring:
    'Opened hall and master boxes — no neutral in either. Kitchen box has one (newer extension).',
  internet: 'weak',
  internetNote: 'Router in hall. One bar in back bedroom, gone in the compound.',
} as const
