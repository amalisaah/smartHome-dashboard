import type { ApiInstalledDevice, ApiInstalledGroup } from '@/types/api'
import type { Room } from '@/types/houseRooms'
import {
  WHOLE_HOUSE_ROOM,
  type DeviceRows,
  type InstalledDevice,
  type InstalledRoom,
} from '@/types/installed'
import { formatShortDate } from '@/utils/format'

/**
 * The wire → block C, and the one business rule this module had to settle.
 *
 * **The shapes do not match.** The API keeps one row per catalogue item per
 * room **per status**, each with its own `quantity`: two working bulbs and one
 * broken one in the master bedroom are two rows. The design draws one line per
 * item with three counts beside it. Folding one onto the other means deciding
 * things the handoff does not say, so each decision is named here:
 *
 *   1. **A line is an item in a room.** Rows are grouped by `item_id` within
 *      their group, because that is what the design's `2× Tuya RGB bulb` is.
 *
 *   2. **`active` is everything on the wall, broken ones included.** This is
 *      the reading the reference's own figures force: its master bedroom shows
 *      a bulb line of `2` active and `1` faulty under a header reading
 *      `4 active`, over lines of 2, 1 and 1 — which only adds up if the faulty
 *      bulb is one of the two, not a third. It is also what the pill says:
 *      `1 of 2 faulty`, one of the two that are up there. So `active` is the
 *      active rows **plus** the faulty ones, and `faulty` says how many of
 *      those are not working.
 *
 *   3. **`job_id` is the provenance.** A row a job wrote carries one; a row
 *      somebody typed does not. That is the dashed/solid chip, and it is the
 *      only thing on the wire that can say it.
 *
 * ⚠️ Two things the design draws that the wire cannot say:
 *
 *   - **when a fault was reported.** `ApiInstalledDevice` has `installed_at`
 *     and `removed_at` and nothing for the fault, so the note renders the
 *     words without the `· reported 22 Sep` the reference draws beside them.
 *   - **a per-unit note.** `notes` belongs to the row, so a line's fault note
 *     is the faulty row's words and its removed note the removed row's. Two
 *     rows of the same status cannot arise, so nothing is lost today.
 */

/** `r4-i12` — the room and the item, which is what makes a line a line. */
const lineId = (roomId: number | null, itemId: number) =>
  `r${roomId ?? 'whole'}-i${itemId}`

/** A catalogue item that has since been deleted still has to be called something. */
const deviceName = (rows: ApiInstalledDevice[], itemId: number) =>
  rows.find((row) => row.item_name)?.item_name ?? `Item #${itemId}`

const sumOf = (rows: ApiInstalledDevice[], status: ApiInstalledDevice['status']) =>
  rows
    .filter((row) => row.status === status)
    .reduce((total, row) => total + row.quantity, 0)

/** The row of a given status, or null — the wire has no row holding zero. */
const rowOf = (rows: ApiInstalledDevice[], status: ApiInstalledDevice['status']) =>
  rows.find((row) => row.status === status) ?? null

/**
 * `removed 14 Aug · swapped for 16A`. The date is the row's own `removed_at`,
 * which the `remove` action stamps; the words after it are what somebody typed.
 */
function removedNote(row: ApiInstalledDevice | null): string | null {
  if (!row) return null
  const when = row.removed_at ? `removed ${formatShortDate(row.removed_at)}` : 'removed'
  return row.notes ? `${when} · ${row.notes}` : when
}

/** One line: every row for one item in one room, folded into three counts. */
function toDevice(
  roomId: number | null,
  itemId: number,
  rows: ApiInstalledDevice[],
): InstalledDevice {
  const activeRow = rowOf(rows, 'active')
  const faultyRow = rowOf(rows, 'faulty')
  const removedRow = rowOf(rows, 'removed')

  // Decision 2: what is on the wall is the working ones and the broken ones.
  const faulty = sumOf(rows, 'faulty')
  const active = sumOf(rows, 'active') + faulty
  const removed = sumOf(rows, 'removed')

  const wireRows: DeviceRows = {
    active: activeRow?.id ?? null,
    faulty: faultyRow?.id ?? null,
    removed: removedRow?.id ?? null,
  }

  // Decision 3: a job wrote it, or a person did. The date is the row's own.
  const written = activeRow ?? faultyRow ?? removedRow ?? rows[0]
  const source = rows.some((row) => row.job_id !== null) ? 'job' : 'hand'
  const stamped = written.installed_at ?? written.updated_at

  return {
    id: lineId(roomId, itemId),
    itemId,
    roomId,
    rows: wireRows,
    name: deviceName(rows, itemId),
    active,
    faulty,
    removed,
    faultPill: faulty > 0 ? `${faulty} of ${active} faulty` : null,
    // ⚠️ No `reported_at` on the wire, so the words stand without their date.
    faultNote: faultyRow?.notes ?? null,
    removedNote: removedNote(removedRow),
    source,
    sourceDate: formatShortDate(stamped),
  }
}

/** Every item in one group, in the order the group lists them. */
function toDevices(roomId: number | null, rows: ApiInstalledDevice[]): InstalledDevice[] {
  const byItem = new Map<number, ApiInstalledDevice[]>()
  for (const row of rows) {
    const found = byItem.get(row.item_id)
    if (found) found.push(row)
    else byItem.set(row.item_id, [row])
  }
  return [...byItem].map(([itemId, itemRows]) => toDevice(roomId, itemId, itemRows))
}

/**
 * The house's rooms and what is in each, in walk order.
 *
 * **The rooms come from the rooms list, not from this endpoint.** Grouped
 * installed-devices only answers with rooms that hold something, and an empty
 * room is the one the design most wants on screen — `Back bedroom · nothing
 * installed` is the upgrade conversation. So the rooms are the walk and the
 * devices are hung off them.
 *
 * The whole-house group comes last and only when it holds something. The
 * handoff says a house has no "whole house" room and the Rooms tab offers
 * none — but the record does have equipment that sits in no room (a hub, a
 * door lock), and leaving it off a screen whose whole job is to say what is on
 * the wall would be the worse lie.
 */
export function toInstalledRooms(
  rooms: readonly Room[],
  groups: readonly ApiInstalledGroup[],
): InstalledRoom[] {
  const byRoom = new Map<number, ApiInstalledDevice[]>()
  let wholeHouse: ApiInstalledDevice[] = []

  for (const group of groups) {
    if (group.room === null) wholeHouse = [...wholeHouse, ...group.devices]
    else byRoom.set(group.room.id, group.devices)
  }

  const walk: InstalledRoom[] = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    type: room.type,
    devices: toDevices(room.id, byRoom.get(room.id) ?? []),
  }))

  if (wholeHouse.length > 0) {
    walk.push({
      id: null,
      name: WHOLE_HOUSE_ROOM,
      type: null,
      devices: toDevices(null, wholeHouse),
    })
  }

  return walk
}

/**
 * How many units are on the wall — what every tab bar's `Installed · n` says.
 *
 * Units, not rows: a row carries a `quantity`, so counting rows would say a
 * house with four bulbs in one fitting has one. Faulty ones count, because they
 * are still up there; removed ones do not, because they are not.
 */
export const installedUnits = (groups: readonly ApiInstalledGroup[]) =>
  groups.reduce(
    (total, group) =>
      total +
      group.devices
        .filter((device) => device.status !== 'removed')
        .reduce((units, device) => units + device.quantity, 0),
    0,
  )

/**
 * `14 Aug` — when a job last wrote this record, or null when none ever has.
 *
 * ⚠️ Every row this API has returned carries `job_id: null`, so this is null in
 * practice: the jobs module that would write them does not exist yet, and the
 * footer's `Written by jobs. Last: …` has no date to name.
 */
export function lastJobDate(groups: readonly ApiInstalledGroup[]): string | null {
  const stamps = groups
    .flatMap((group) => group.devices)
    .filter((row) => row.job_id !== null)
    .map((row) => row.installed_at ?? row.updated_at)

  if (stamps.length === 0) return null
  return formatShortDate(stamps.reduce((latest, at) => (at > latest ? at : latest)))
}
