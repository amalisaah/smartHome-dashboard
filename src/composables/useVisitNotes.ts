import { computed, onScopeDispose, reactive, ref, watch } from 'vue'
import { toHousePatch, toPinPatch, updateHouse, updateRoomSpace } from '@/api/houses'
import { ApiRequestError } from '@/api/http'
import {
  blankVisitNotes,
  nextRoomType,
  INTERNET_VALUES,
  type HeldItem,
  type VisitNotesDraft,
  type VisitPin,
  type VisitRoom,
} from '@/types/houseVisit'
import { isRecord, sessionFamily, type Validator } from '@/utils/storage'

/**
 * What he types in her house, and everything that happens to it afterwards.
 *
 * There is no save button on block A, so this is the whole of saving. Three
 * things happen to a keystroke, in this order and never any other:
 *
 *   1. **It goes on screen.** Immediately, unconditionally. Nothing below this
 *      line may delay, block or undo that.
 *   2. **It goes to this phone** — session storage, keyed by the house — so a
 *      closed tab, a call or a flat battery does not lose it.
 *   3. **It goes to the server**, debounced, as a `PATCH` of only the fields
 *      that changed. If that fails or there is no signal, it stays queued and
 *      goes when the signal comes back.
 *
 * The queue is also what A2 renders. The "waiting to send" list is not a
 * description of a sync layer somewhere else — it is this map, read out: what
 * has not been accepted yet, and the span of clock time over which it was
 * typed. That is why the screen can say it truthfully.
 */

type NoteField = keyof VisitNotesDraft

/** When something was first and last touched, in epoch millis. */
interface Span {
  first: number
  last: number
}

const touch = (span: Span | undefined, at: number): Span => ({
  first: span?.first ?? at,
  last: at,
})

/**
 * Anything that is not a whole draft is dropped rather than repaired — a
 * half-shape from an older build would otherwise re-render as blank fields
 * beside full ones and read as lost work.
 */
const isVisitNotes: Validator<VisitNotesDraft> = (raw) => {
  const record = isRecord(raw)
  if (!record) return null

  const text = (key: keyof VisitNotesDraft) =>
    typeof record[key] === 'string' ? (record[key] as string) : null

  const directions = text('directions')
  const address = text('address')
  const access = text('access')
  const wiring = text('wiring')
  const internetNote = text('internetNote')
  const internet = INTERNET_VALUES.find((value) => value === record.internet)

  if (
    directions === null ||
    address === null ||
    access === null ||
    wiring === null ||
    internetNote === null ||
    internet === undefined
  ) {
    return null
  }

  return { directions, address, access, wiring, internet, internetNote }
}

const drafts = sessionFamily<VisitNotesDraft>('house-visit', isVisitNotes)

const CLOCK = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const clock = (at: number) => CLOCK.format(new Date(at))

/** `13:41–13:58`, or a single `14:02` when it was all one moment. */
const spanLabel = (span: Span) => {
  const from = clock(span.first)
  const to = clock(span.last)
  return from === to ? to : `${from}–${to}`
}

const widest = (spans: Span[]): Span => ({
  first: Math.min(...spans.map((s) => s.first)),
  last: Math.max(...spans.map((s) => s.last)),
})

/**
 * The note fields in the order the screen puts them, and the word each is
 * called in the queue. `internet` and its note are one thing to him, so they
 * are one word here.
 */
const QUEUE_WORD: Record<NoteField, string> = {
  directions: 'directions',
  address: 'address',
  access: 'access',
  wiring: 'wiring',
  internet: 'internet',
  internetNote: 'internet',
}

const FIELD_ORDER: NoteField[] = [
  'directions',
  'address',
  'access',
  'wiring',
  'internet',
  'internetNote',
]

/** A write that never reached the server is not a write that was refused. */
const isUnreachable = (error: unknown) =>
  error instanceof ApiRequestError ? error.isNetworkFailure || error.status >= 500 : true

/** How long after the last keystroke the request goes. */
const SETTLE_MS = 700

export function useVisitNotes(houseId: number) {
  const draft = reactive<VisitNotesDraft>(blankVisitNotes())
  const pin = ref<VisitPin | null>(null)
  const rooms = ref<VisitRoom[]>([])

  /** Edits the server has not accepted yet. Empty is "everything is sent". */
  const pendingFields = reactive(new Map<NoteField, Span>())
  const pendingPin = ref<Span | null>(null)
  const pendingRooms = reactive(new Map<number, Span>())

  /** When the last write landed — what the phone header says. */
  const savedAt = ref<string | null>(null)

  /** A write was refused, as opposed to never leaving the phone. */
  const refused = ref(false)

  // --- seeding ---------------------------------------------------------------

  /**
   * What he was in the middle of typing, from an earlier mount of this screen.
   * It is restored before anything is read, so a reload mid-visit shows his
   * words rather than the server's — and it stays pending, because it was
   * never sent.
   */
  const stored = drafts.read(houseId)
  if (stored) Object.assign(draft, stored)

  /** True once he has typed. Guards the seed and nothing else. */
  const touched = ref(stored !== null)

  let seeding = false

  /**
   * The house as the API holds it. Ignored once he has typed: what is in front
   * of him outranks what was stored, and seeding over it would take words off
   * the screen while he is looking at them.
   */
  function seed(notes: VisitNotesDraft) {
    if (touched.value) return
    seeding = true
    Object.assign(draft, notes)
  }

  /** The stored position. Never overwrites one dropped in this session. */
  function seedPin(next: VisitPin | null) {
    if (pendingPin.value === null) pin.value = next
  }

  /** The rooms as read. Any whose type is still in flight keep theirs. */
  function seedRooms(next: VisitRoom[]) {
    rooms.value = next.map((room) => {
      const local = pendingRooms.has(room.id)
        ? rooms.value.find((r) => r.id === room.id)
        : undefined
      return local ?? room
    })
  }

  // --- the house write -------------------------------------------------------

  let settle: ReturnType<typeof setTimeout> | undefined
  let inFlight = false

  const schedule = () => {
    clearTimeout(settle)
    settle = setTimeout(flushHouse, SETTLE_MS)
  }

  async function flushHouse() {
    if (inFlight) return

    const fields = [...pendingFields.entries()]
    const pinSpan = pendingPin.value
    if (fields.length === 0 && pinSpan === null) return

    // Everything edited before this moment is what the request carries; a
    // keystroke landing while it is out stays pending and goes in the next one.
    const sentAt = Date.now()
    const patch = {
      ...toHousePatch(Object.fromEntries(fields.map(([field]) => [field, draft[field]]))),
      ...(pinSpan === null ? {} : toPinPatch(pin.value)),
    }

    inFlight = true
    try {
      await updateHouse(houseId, patch)

      for (const [field, span] of fields) {
        if (span.last <= sentAt) pendingFields.delete(field)
      }
      if (pinSpan !== null && pinSpan.last <= sentAt) pendingPin.value = null

      savedAt.value = clock(Date.now())
      refused.value = false

      // Nothing is outstanding, so the copy on the phone has done its job.
      if (pendingFields.size === 0 && pendingPin.value === null) drafts.clear(houseId)
    } catch (error) {
      // Unreachable: it waits for signal. Refused: saying "saved" would be a
      // lie, and the words are still safe on the phone either way.
      refused.value = !isUnreachable(error)
    } finally {
      inFlight = false
      // Typed while the request was out — go again. Not after a failure: that
      // is what coming back online is for, and a tight retry loop helps nobody.
      if (!refused.value && (pendingFields.size > 0 || pendingPin.value !== null)) {
        if (navigator.onLine) schedule()
      }
    }
  }

  /** The last values seen, so the watcher knows which fields actually moved. */
  let previous: VisitNotesDraft = { ...draft }

  // Every change, not every pause, for the phone; the server waits for the
  // pause. A write that waits is a write a closed tab loses.
  watch(
    () => ({ ...draft }),
    (value) => {
      // The read landing is not a change he made: it neither queues nor stamps.
      // `previous` still moves on, or the next real edit would diff against the
      // blank form and queue every field at once.
      if (seeding) {
        seeding = false
        previous = value
        return
      }

      const at = Date.now()
      touched.value = true

      for (const field of FIELD_ORDER) {
        if (value[field] !== previous[field]) {
          pendingFields.set(field, touch(pendingFields.get(field), at))
        }
      }
      previous = value

      drafts.write(houseId, value)
      schedule()
    },
    { deep: false },
  )

  // --- the pin ---------------------------------------------------------------

  /** Dropping one, or clearing it. Both are a change to the same two columns. */
  function setPin(next: VisitPin | null) {
    pin.value = next
    pendingPin.value = touch(pendingPin.value ?? undefined, Date.now())
    schedule()
  }

  // --- rooms -----------------------------------------------------------------

  /**
   * One click on a type chip. It answers on screen first and writes after —
   * the chip is the kind of thing that gets clicked three times in a row, and
   * waiting on each would make it feel broken.
   */
  async function cycleRoom(roomId: number) {
    const before = rooms.value.find((room) => room.id === roomId)
    if (!before) return

    const after = nextRoomType(before)
    rooms.value = rooms.value.map((room) => (room.id === roomId ? after : room))

    // Confirming a guess changes nothing the wire holds, so there is nothing to
    // send: `space_slug` was already this value, it was only marked uncertain.
    if (after.type === null || after.type === before.type) return

    pendingRooms.set(roomId, touch(pendingRooms.get(roomId), Date.now()))
    try {
      await updateRoomSpace(roomId, after.type)
      pendingRooms.delete(roomId)
      savedAt.value = clock(Date.now())
    } catch (error) {
      // Left on screen and left queued: he saw it change, and it will go.
      refused.value = !isUnreachable(error)
    }
  }

  /** Anything queued goes the moment there is a connection to put it through. */
  function retry() {
    if (pendingFields.size > 0 || pendingPin.value !== null) {
      refused.value = false
      flushHouse()
    }
    for (const roomId of pendingRooms.keys()) {
      const room = rooms.value.find((r) => r.id === roomId)
      if (room?.type) updateRoomSpace(roomId, room.type).then(() => pendingRooms.delete(roomId))
    }
  }

  onScopeDispose(() => clearTimeout(settle))

  // --- what the screen reads -------------------------------------------------

  /** `saved · 14:02`, or nothing to say yet. */
  const savedLabel = computed(() => (savedAt.value ? `saved · ${savedAt.value}` : null))

  const pendingNoteCount = computed(() => pendingFields.size)
  const pendingRoomCount = computed(() => pendingRooms.size)

  /**
   * A2's list. Three lines, because this screen writes three kinds of thing:
   * the notes, the rooms and the pin.
   */
  const queue = computed<HeldItem[]>(() => {
    const items: HeldItem[] = []

    const fields = FIELD_ORDER.filter((field) => pendingFields.has(field))
    if (fields.length > 0) {
      // Each word once, in the order the screen puts the blocks.
      const words = [...new Set(fields.map((field) => QUEUE_WORD[field]))]
      const label = words.join(', ')
      items.push({
        id: 'notes',
        label: label.charAt(0).toUpperCase() + label.slice(1),
        at: spanLabel(widest(fields.map((field) => pendingFields.get(field)!))),
      })
    }

    if (pendingRooms.size > 0) {
      items.push({
        id: 'rooms',
        label: `${pendingRooms.size} ${pendingRooms.size === 1 ? 'room' : 'rooms'}`,
        at: spanLabel(widest([...pendingRooms.values()])),
      })
    }

    if (pendingPin.value !== null) {
      items.push({ id: 'pin', label: 'GPS pin', at: spanLabel(pendingPin.value) })
    }

    return items
  })

  return {
    draft,
    pin,
    rooms,
    seed,
    seedPin,
    seedRooms,
    setPin,
    cycleRoom,
    retry,
    savedLabel,
    refused,
    queue,
    pendingNoteCount,
    pendingRoomCount,
  }
}
