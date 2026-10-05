/**
 * One house, as block C draws it.
 *
 * ⚠️ FLAG — **this stands in for the API, for the Installed tab only.** The
 * Rooms tab is wired: see `useHouseRoomsEditor`. What keeps block C off the
 * wire is the shape — `ApiInstalledDevice` is one row per status where C is one
 * row per device carrying all three counts at once, with no fault-note /
 * removed-note split and nothing saying who wrote it. Deciding how one becomes
 * the other is the business rule this screen does not own. See
 * `@/types/installed`. Every value here is the handoff's own.
 *
 * ⚠️ The room ids below are the reference's, not the API's, so the Installed
 * tab's rooms are **not** the Rooms tab's rooms until block C is wired.
 */

import type { BeforeYouTouch, InstalledRoom } from '@/types/installed'

/** What is in her rooms, in walk order. */
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
