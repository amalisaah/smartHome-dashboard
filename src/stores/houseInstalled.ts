import { computed, reactive } from 'vue'
import {
  MOCK_BEFORE_YOU_TOUCH,
  MOCK_INSTALLED,
  MOCK_INSTALLED_SUMMARY,
  MOCK_LAST_JOB_DATE,
} from '@/data/houseRecordMock'
import {
  installedTotals,
  type CountField,
  type InstalledRoom,
} from '@/types/installed'
import { formatShortDate } from '@/utils/format'

/**
 * What is installed in her house, for as long as the tab is open.
 *
 * Module-scoped and keyed by house, like the rooms beside it: the phone's
 * read, the phone's correction sheet and the laptop's table are three views of
 * one record, and a count corrected on one of them has to be the count the
 * other two show.
 *
 * ⚠️ FLAG — **nothing here is written anywhere,** and the shape is not the
 * wire's. `ApiInstalledDevice` is one row per status with a `quantity`; a line
 * here carries all three counts at once, plus which of its notes is the fault
 * and which the removal, plus who wrote it. Deciding how one becomes the other
 * is the business rule this screen does not own. See `@/types/installed`.
 */

const houses = reactive<Record<number, InstalledRoom[]>>({})

function entry(houseId: number): InstalledRoom[] {
  if (!houses[houseId]) {
    // Deep-copied: a stepper changes the screen's record, not the mock.
    houses[houseId] = MOCK_INSTALLED.map((room) => ({
      ...room,
      devices: room.devices.map((device) => ({ ...device })),
    }))
  }
  return houses[houseId]
}

export function useHouseInstalledStore(houseId: number) {
  const rooms = computed(() => entry(houseId))
  const totals = computed(() => installedTotals(rooms.value))

  /**
   * A count, changed by hand.
   *
   * Two things happen and they happen together: the number moves, and the row
   * says a person moved it. That second half is the point of the mode — a later
   * reader has to be able to tell a count a job wrote from a count somebody
   * typed, and the chip is the only place that is said.
   *
   * Counts never go below zero. There is no such thing as minus one bulb, and a
   * stepper that let him type one would put it in the record.
   */
  function setCount(deviceId: number, field: CountField, value: number) {
    for (const room of entry(houseId)) {
      const device = room.devices.find((candidate) => candidate.id === deviceId)
      if (!device) continue

      const next = Math.max(0, value)
      if (device[field] === next) return

      device[field] = next
      device.source = 'hand'
      device.sourceDate = formatShortDate(new Date().toISOString())
      return
    }
  }

  const step = (deviceId: number, field: CountField, by: number) => {
    for (const room of entry(houseId)) {
      const device = room.devices.find((candidate) => candidate.id === deviceId)
      if (device) {
        setCount(deviceId, field, device[field] + by)
        return
      }
    }
  }

  return {
    rooms,
    totals,
    lastJobDate: MOCK_LAST_JOB_DATE,
    summaryPhrase: MOCK_INSTALLED_SUMMARY,
    beforeYouTouch: MOCK_BEFORE_YOU_TOUCH,
    setCount,
    step,
  }
}
