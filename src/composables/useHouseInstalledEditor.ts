import { computed, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import {
  createDevice,
  markDeviceFaulty,
  markDeviceRemoved,
  setDeviceQuantity,
} from '@/api/houses'
import { houseKeys } from '@/api/hooks/houses'
import { ApiRequestError } from '@/api/http'
import {
  installedTotals,
  type CountField,
  type InstalledDevice,
  type InstalledRoom,
} from '@/types/installed'

/**
 * What is installed, and the whole of correcting it by hand.
 *
 * There is no save button: a count is kept as it is stepped, and stepping it is
 * what flips the row to `by hand`. The screen answers first and the request
 * goes after, because a stepper gets pressed three times in a row.
 *
 * **A step is a move between statuses, not an edit of a number.** The wire
 * keeps one row per status, so "one of the two bulbs is broken" is one row
 * losing a unit and another gaining one. Which requests that takes depends on
 * whether the whole row is moving:
 *
 *   - **the whole row** → the action endpoint (`/faulty`, `/remove`), which
 *     flips its status in place and keeps its `job_id`, its `installed_at` and
 *     its notes;
 *   - **part of it** → the source row's quantity down by one, and a new row of
 *     the target status, or the existing one up by one.
 *
 * ⚠️ **One move the API cannot make: a row can never be emptied.** `quantity`
 * has an exclusive minimum of 0 and there is no delete, so the *last* unit of a
 * status cannot be stepped out of it — and there is no action that puts a row
 * back to `active`, so a repaired bulb cannot be recorded as working at all
 * when it is the only faulty one. `blocked` below names each case the stepper
 * has to refuse; the `−` is disabled there rather than failing after the press.
 */

/** Where a unit comes from when one arrives at a status. */
const SOURCE: Record<CountField, CountField | null> = {
  // A unit becoming active came back from being broken, or back onto the wall.
  active: null,
  // A unit becomes faulty by breaking: it was on the wall and working.
  faulty: 'active',
  // A unit becomes removed by coming off the wall.
  removed: 'active',
}

export function useHouseInstalledEditor(houseId: number) {
  /**
   * A step can create a row, empty-but-for-one another and flip a third, so
   * the row ids a line was folded from are stale the moment one lands. There is
   * nothing to patch into the cache that would be right — the fold has to be
   * made again — so the read is invalidated and done again. One `GET` per
   * press, which is what correcting by hand costs.
   */
  const queryClient = useQueryClient()
  const reread = () =>
    queryClient.invalidateQueries({ queryKey: houseKeys.installed(houseId) })

  /** What is on screen. Seeded by the read, and ahead of it while a write is out. */
  const rooms = ref<InstalledRoom[]>([])

  /** A write was refused, as opposed to never having left the phone. */
  const refused = ref(false)

  /** Set while a step is in flight, so two presses cannot race one row. */
  const busy = ref(new Set<string>())

  const isUnreachable = (error: unknown) =>
    error instanceof ApiRequestError ? error.isNetworkFailure || error.status >= 500 : true

  function seed(next: readonly InstalledRoom[]) {
    rooms.value = next.map((room) => ({ ...room, devices: [...room.devices] }))
  }

  const find = (deviceId: string) => {
    for (const room of rooms.value) {
      const device = room.devices.find((candidate) => candidate.id === deviceId)
      if (device) return device
    }
    return null
  }

  /**
   * Why a step cannot be made, or null when it can.
   *
   * All three cases are the same missing operation said three ways: the wire
   * cannot hold a row of zero, and has no way back to `active`.
   */
  function blocked(device: InstalledDevice, field: CountField, by: number): string | null {
    /** On the wall and working — what a unit has to be before it can break. */
    const working = device.active - device.faulty

    if (by > 0) {
      if (field === 'active') return null
      // A unit cannot break, or come off a wall, that it is not working on.
      return working > 0
        ? null
        : `There is no working ${device.name} to mark ${field}.`
    }

    if (device[field] <= 0) return null

    // ⚠️ The one operation this API does not have. Stepping the last unit of a
    // status away would leave its row holding zero, and `quantity` cannot be
    // zero and the row cannot be deleted. For `faulty` and `removed` the unit
    // would also have to become `active` again, and there is no action for it.
    const lastOnItsRow = field === 'active' ? working === 1 : device[field] === 1
    return lastOnItsRow
      ? 'The API cannot empty a row or put one back to active, so the last one cannot be stepped down.'
      : null
  }

  /** Whether the screen should offer the step at all. */
  const canStep = (deviceId: string, field: CountField, by: number) => {
    const device = find(deviceId)
    return device !== null && blocked(device, field, by) === null
  }

  /**
   * One press. The counts move on screen immediately; what reaches the wire is
   * worked out from the rows the line was folded from.
   */
  async function step(deviceId: string, field: CountField, by: number) {
    const device = find(deviceId)
    if (!device || busy.value.has(deviceId)) return
    if (blocked(device, field, by) !== null) return

    busy.value = new Set([...busy.value, deviceId])
    // On screen first, because he is pressing it again already.
    applyLocally(deviceId, field, by)
    try {
      await (by > 0 ? gain(device, field) : lose(device, field))
      refused.value = false
      await reread()
    } catch (error) {
      refused.value = !isUnreachable(error)
      // The screen is now ahead of the record in a way nothing will correct, so
      // it is put back to what the record actually holds.
      await reread()
    } finally {
      const next = new Set(busy.value)
      next.delete(deviceId)
      busy.value = next
    }
  }

  /**
   * The press, on screen.
   *
   * `active` is everything on the wall, so breaking a unit moves it between
   * columns without changing it, and removing one takes it off the wall.
   */
  function applyLocally(deviceId: string, field: CountField, by: number) {
    rooms.value = rooms.value.map((room) => ({
      ...room,
      devices: room.devices.map((device) => {
        if (device.id !== deviceId) return device

        const next = { ...device, [field]: device[field] + by }
        // A unit coming off the wall leaves the wall; one breaking stays on it.
        if (field === 'removed') next.active = device.active - by
        next.faultPill =
          next.faulty > 0 ? `${next.faulty} of ${next.active} faulty` : null
        return next
      }),
    }))
  }

  /** How many units a status' own row holds, as opposed to the folded count. */
  const onRow = (device: InstalledDevice, field: CountField) =>
    field === 'active' ? device.active - device.faulty : device[field]

  /** A unit arrives at `field`. */
  async function gain(device: InstalledDevice, field: CountField) {
    const from = SOURCE[field]

    // Nothing to take it from — this is simply one more of them on the wall.
    if (from === null) {
      const row = device.rows.active
      if (row === null) {
        await createDevice(houseId, {
          item_id: device.itemId,
          room_id: device.roomId,
          quantity: 1,
          status: 'active',
        })
      } else {
        await setDeviceQuantity(row, onRow(device, 'active') + 1)
      }
      return
    }

    const sourceRow = device.rows[from]
    if (sourceRow === null) return

    // The whole row is moving, so the action endpoint flips it where it stands
    // and the row keeps everything that was known about it.
    if (onRow(device, from) === 1) {
      await (field === 'faulty' ? markDeviceFaulty(sourceRow) : markDeviceRemoved(sourceRow))
      return
    }

    // Part of it. One unit leaves the source and joins the target.
    await setDeviceQuantity(sourceRow, onRow(device, from) - 1)

    const targetRow = device.rows[field]
    if (targetRow === null) {
      await createDevice(houseId, {
        item_id: device.itemId,
        room_id: device.roomId,
        quantity: 1,
        status: field === 'faulty' ? 'faulty' : 'removed',
      })
    } else {
      await setDeviceQuantity(targetRow, onRow(device, field) + 1)
    }
  }

  /** A unit leaves `field` — repaired, or put back on the wall. */
  async function lose(device: InstalledDevice, field: CountField) {
    const row = device.rows[field]
    if (row === null) return

    // `blocked` has already refused the cases that would empty the row.
    await setDeviceQuantity(row, onRow(device, field) - 1)

    if (field === 'active') return

    // It is working again, and on the wall.
    const activeRow = device.rows.active
    if (activeRow === null) {
      await createDevice(houseId, {
        item_id: device.itemId,
        room_id: device.roomId,
        quantity: 1,
        status: 'active',
      })
    } else {
      await setDeviceQuantity(activeRow, onRow(device, 'active') + 1)
    }
  }

  const totals = computed(() => installedTotals(rooms.value))

  return { rooms, totals, refused, busy, seed, step, canStep }
}
