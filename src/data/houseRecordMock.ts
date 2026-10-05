/**
 * One house, as blocks B and C draw it.
 *
 * ⚠️ FLAG — **this stands in for the API.** Neither tab can be read off the
 * endpoints that exist: `ApiRoom.space_slug` is required and carries no "this
 * was guessed", so B's two central states (`type?` and the dashed guess) have
 * no source; and `ApiInstalledDevice` is one row per status where C is one row
 * per device carrying all three counts, with no fault-note / removed-note split
 * and nothing saying who wrote it. See `@/types/houseRooms` and
 * `@/types/installed` for the detail. Every value here is the handoff's own.
 *
 * **The reference draws two houses; this is one.** Block B is drawn on a house
 * of five rooms with nothing installed, block C on a house of six with sixteen.
 * A screen whose Rooms tab and Installed tab disagree about how many rooms
 * there are is worse than a screen that differs from the drawing by a row, so
 * block C's house is the one, and block B's list shows its six rooms. Every
 * total, chip count and footer figure is then read off these rows rather than
 * written down beside them — which reproduces block C's reference exactly
 * (16 active · 1 faulty · 3 removed) and block B's except for the room count.
 */

import type { Room } from '@/types/houseRooms'
import type { BeforeYouTouch, InstalledRoom } from '@/types/installed'

/**
 * Her rooms, in walk order — the order he entered them, standing in the house.
 *
 * `Kitchen` is the one guessed type, which is the state the reference is drawn
 * in: the name said `kitchen` and nobody has agreed with it out loud yet.
 */
export const MOCK_ROOMS: readonly Room[] = [
  { id: 1, name: 'Master', type: 'bedroom', guessed: false },
  { id: 2, name: 'Kids room', type: 'bedroom', guessed: false },
  { id: 3, name: 'Back bedroom', type: 'bedroom', guessed: false },
  { id: 4, name: 'Hall', type: 'living_room', guessed: false },
  { id: 5, name: 'Kitchen', type: 'kitchen', guessed: true },
  { id: 6, name: 'Compound', type: 'outdoor', guessed: false },
]

/**
 * What is in them. Device ids are the record's, room ids are `MOCK_ROOMS`' —
 * the two tabs are two views of one house, so a room is the same room in both.
 */
export const MOCK_INSTALLED: readonly InstalledRoom[] = [
  {
    id: 1,
    name: 'Master',
    type: 'bedroom',
    devices: [
      {
        id: 101,
        name: 'Tuya RGB bulb, E27',
        active: 2,
        faulty: 1,
        removed: 0,
        faultPill: '1 of 2 faulty',
        faultNote: 'flickers · reported 22 Sep',
        removedNote: null,
        source: 'job',
        sourceDate: '14 Aug',
      },
      {
        id: 102,
        name: 'Tuya no-neutral switch, 2 gang',
        active: 1,
        faulty: 0,
        removed: 0,
        faultPill: null,
        faultNote: null,
        removedNote: null,
        source: 'job',
        sourceDate: '14 Aug',
      },
      {
        id: 103,
        name: 'Smart plug, 16A',
        active: 1,
        faulty: 0,
        removed: 0,
        faultPill: null,
        faultNote: null,
        removedNote: null,
        source: 'job',
        sourceDate: '14 Aug',
      },
      {
        id: 104,
        name: 'Smart plug, 10A',
        active: 0,
        faulty: 0,
        removed: 1,
        faultPill: null,
        faultNote: null,
        removedNote: 'removed 14 Aug · swapped for 16A',
        source: 'job',
        sourceDate: '14 Aug',
      },
    ],
  },
  {
    id: 2,
    name: 'Kids room',
    type: 'bedroom',
    devices: [
      {
        id: 201,
        name: 'Tuya RGB bulb, E27',
        active: 1,
        faulty: 0,
        removed: 0,
        faultPill: null,
        faultNote: null,
        removedNote: null,
        source: 'job',
        sourceDate: '14 Aug',
      },
      // The one line in the record a person put there, and the reason the solid
      // chip exists: a door sensor nobody raised a job for.
      {
        id: 202,
        name: 'Door sensor, battery',
        active: 1,
        faulty: 0,
        removed: 0,
        faultPill: null,
        faultNote: null,
        removedNote: null,
        source: 'hand',
        sourceDate: '2 Sep',
      },
    ],
  },
  // Stays in the list with nothing in it. That blank is the upgrade
  // conversation, and hiding it would hide the conversation.
  { id: 3, name: 'Back bedroom', type: 'bedroom', devices: [] },
  {
    id: 4,
    name: 'Hall',
    type: 'living_room',
    devices: [
      {
        id: 401,
        name: 'Tuya RGB bulb, E27',
        active: 4,
        faulty: 0,
        removed: 0,
        faultPill: null,
        faultNote: null,
        removedNote: null,
        source: 'job',
        sourceDate: '14 Aug',
      },
      {
        id: 402,
        name: 'Tuya no-neutral switch, 3 gang',
        active: 1,
        faulty: 0,
        removed: 0,
        faultPill: null,
        faultNote: null,
        removedNote: null,
        source: 'job',
        sourceDate: '14 Aug',
      },
      {
        id: 403,
        name: 'IR remote hub',
        active: 1,
        faulty: 0,
        removed: 0,
        faultPill: null,
        faultNote: null,
        removedNote: null,
        source: 'job',
        sourceDate: '14 Aug',
      },
    ],
  },
  {
    id: 5,
    name: 'Kitchen',
    type: 'kitchen',
    devices: [
      {
        id: 501,
        name: 'Smart plug, 16A',
        active: 1,
        faulty: 0,
        removed: 0,
        faultPill: null,
        faultNote: null,
        removedNote: null,
        source: 'job',
        sourceDate: '14 Aug',
      },
    ],
  },
  {
    id: 6,
    name: 'Compound',
    type: 'outdoor',
    devices: [
      {
        id: 601,
        name: 'CCTV camera, 3MP, outdoor',
        active: 2,
        faulty: 0,
        removed: 0,
        faultPill: null,
        faultNote: null,
        removedNote: null,
        source: 'job',
        sourceDate: '14 Aug',
      },
      {
        id: 602,
        name: 'Relay module, 2 channel',
        active: 1,
        faulty: 0,
        removed: 0,
        faultPill: null,
        faultNote: null,
        removedNote: null,
        source: 'job',
        sourceDate: '14 Aug',
      },
      {
        id: 603,
        name: 'CCTV camera, 2MP, outdoor',
        active: 0,
        faulty: 0,
        removed: 1,
        faultPill: null,
        faultNote: null,
        removedNote: 'removed 14 Aug · upgraded',
        source: 'job',
        sourceDate: '14 Aug',
      },
      {
        id: 604,
        name: 'Motion floodlight',
        active: 0,
        faulty: 0,
        removed: 1,
        faultPill: null,
        faultNote: null,
        removedNote: 'removed 2 Jun · she took it down',
        source: 'job',
        sourceDate: '14 Aug',
      },
    ],
  },
]

/** The three lines a fixer reads first. Summaries of Visit notes, supplied. */
export const MOCK_BEFORE_YOU_TOUCH: BeforeYouTouch = {
  wiring: 'No neutral in hall or master boxes. Kitchen has one.',
  internet: 'Weak — router in hall, nothing in the compound.',
  access: 'Dog — ask her to tie it. After 4pm.',
}

/** The last job to write the record. */
export const MOCK_LAST_JOB_DATE = '14 Aug'

/** The mono line beside `Her house` on the Installed tab. Supplied. */
export const MOCK_INSTALLED_SUMMARY = 'customer since Aug 2026 · last job 14 Aug'

/** The same line on the Rooms tab, which is about the visit rather than the job. */
export const MOCK_ROOMS_SUMMARY = 'visited 30 Sep · 13:41–14:02 · on phone'

/**
 * The two read-only entries beside the laptop's room list. They are here
 * because they decide what each room can take — a room with no neutral cannot
 * have a smart switch, whatever its type says.
 */
export const MOCK_VISIT_FACTS = {
  wiring:
    'Opened hall and master boxes — no neutral in either. Kitchen box has one (newer extension).',
  internet: 'Router in hall. One bar in back bedroom, gone in the compound.',
}
