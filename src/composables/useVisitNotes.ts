import { computed, nextTick, onScopeDispose, reactive, ref, watch } from 'vue'
import {
  textOrNull,
  toHousePatch,
  toPinPatch,
  updateHouse,
  updateRoomSpace,
} from '@/api/houses'
import { toVisitNotes } from '@/utils/mapper/houseVisitMapper'
import { ApiRequestError } from '@/api/http'
import {
  blankVisitNotes,
  nextRoomType,
  INTERNET_VALUES,
  ROOM_TYPES,
  type HeldItem,
  type VisitNotesDraft,
  type VisitPin,
  type VisitRoom,
} from '@/types/houseVisit'
import { isFiniteNumber, isRecord, sessionFamily, type Validator } from '@/utils/storage'
import type { ApiSpaceSlug } from '@/types/api'

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
 * description of a sync layer somewhere else — it is this state, read out: what
 * has not been accepted yet, and the span of clock time over which it was
 * typed. That is why the screen can say it truthfully.
 *
 * **The invariant everything here serves: anything on screen that differs from
 * the server is queued.** It is stated because it is easy to break — restoring
 * a draft from storage puts words on screen without anything having been typed,
 * so the restore has to queue them itself or the two diverge in silence for the
 * rest of the session. What is stored is therefore not the draft alone but the
 * whole of the unsent work: the words, which fields are outstanding and when
 * they were typed, the pin, and the room types he chose. The banner counts
 * notes *and rooms*; both have to survive a reload for it to be true.
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

/** A room type he chose that the server has not taken yet. */
interface RoomEdit {
  slug: ApiSpaceSlug
  span: Span
}

/**
 * Everything typed here and not yet acknowledged, as it survives a reload.
 *
 * The spans are stored with it so a restored queue still says *when* the words
 * were written — `13:41–13:58` is a fact about the visit, and re-stamping it
 * with the time of the reload would be a small lie on a screen whose whole job
 * is to be trusted about what it has kept.
 */
interface UnsentWork {
  notes: VisitNotesDraft
  fields: [NoteField, Span][]
  pin: VisitPin | null
  pinSpan: Span | null
  rooms: [number, RoomEdit][]
}

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

const isSpan: Validator<Span> = (raw) => {
  const record = isRecord(raw)
  if (!record) return null
  const first = isFiniteNumber(record.first)
  const last = isFiniteNumber(record.last)
  return first === null || last === null ? null : { first, last }
}

/** `null` is a real stored value here — "there is no pin" — and is not a failure. */
const isPin: Validator<VisitPin | null> = (raw) => {
  if (raw === null) return null as VisitPin | null
  const record = isRecord(raw)
  if (!record) return null
  const lat = isFiniteNumber(record.lat)
  const lng = isFiniteNumber(record.lng)
  if (lat === null || lng === null) return null
  return {
    lat,
    lng,
    // Both are allowed to be absent — the wire has no column for either.
    accuracyM: isFiniteNumber(record.accuracyM),
    time: typeof record.time === 'string' ? record.time : null,
  }
}

/**
 * The whole of the unsent work, or nothing.
 *
 * All-or-nothing on purpose: a half-understood shape would restore some of his
 * words and quietly drop the rest, which is worse than starting from the record
 * — he can see an empty field, he cannot see a missing sentence.
 */
const isUnsentWork: Validator<UnsentWork> = (raw) => {
  const record = isRecord(raw)
  if (!record) return null

  const notes = isVisitNotes(record.notes)
  if (notes === null) return null

  if (!Array.isArray(record.fields) || !Array.isArray(record.rooms)) return null

  const fields: [NoteField, Span][] = []
  for (const entry of record.fields) {
    if (!Array.isArray(entry) || entry.length !== 2) return null
    const [field, span] = entry
    if (!FIELD_ORDER.includes(field as NoteField)) return null
    const checked = isSpan(span)
    if (checked === null) return null
    fields.push([field as NoteField, checked])
  }

  const rooms: [number, RoomEdit][] = []
  for (const entry of record.rooms) {
    if (!Array.isArray(entry) || entry.length !== 2) return null
    const [id, edit] = entry
    const roomId = isFiniteNumber(id)
    const shape = isRecord(edit)
    if (roomId === null || !shape) return null
    const slug = ROOM_TYPES.find((value) => value === shape.slug)
    const span = isSpan(shape.span)
    if (slug === undefined || span === null) return null
    rooms.push([roomId, { slug, span }])
  }

  // A pin that failed to parse is not the same as no pin, so the two are told
  // apart before the value is trusted.
  const pin = record.pin === null ? null : isPin(record.pin)
  if (record.pin !== null && pin === null) return null

  const pinSpan = record.pinSpan === null ? null : isSpan(record.pinSpan)
  if (record.pinSpan !== null && pinSpan === null) return null

  return { notes, fields, pin, pinSpan, rooms }
}

const unsent = sessionFamily<UnsentWork>('house-visit', isUnsentWork)

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

/**
 * How long after the last keystroke a request goes.
 *
 * 2.5s is a pause in which he has actually stopped — a word boundary on a phone
 * is a few hundred milliseconds, and debouncing under one turns every space bar
 * into a round trip. It can afford to be this generous because leaving a field
 * sends it immediately (`flushNow` on focusout), so this only has to catch the
 * case where he stays in one field for minutes.
 */
const SETTLE_MS = 2_500

/**
 * And never longer than this with something unsent, however continuously he
 * types. A ceiling rather than a second timer: the debounce is checked against
 * the age of the oldest unsent edit, and once that is this old the next change
 * goes straight out.
 */
const MAX_WAIT_MS = 30_000

export function useVisitNotes(houseId: number) {
  const draft = reactive<VisitNotesDraft>(blankVisitNotes())
  const pin = ref<VisitPin | null>(null)
  const rooms = ref<VisitRoom[]>([])

  /** Edits the server has not accepted yet. Empty is "everything is sent". */
  const pendingFields = reactive(new Map<NoteField, Span>())
  const pendingPin = ref<Span | null>(null)
  /** Carries the chosen slug as well as the time: a reload has to re-send it. */
  const pendingRooms = reactive(new Map<number, RoomEdit>())

  /** When the last write landed — what the phone header says. */
  const savedAt = ref<string | null>(null)

  /** A write was refused, as opposed to never leaving the phone. */
  const refused = ref(false)

  /**
   * What the server is believed to hold — seeded by the read, replaced by every
   * answer, which carries the whole house and is therefore authoritative.
   *
   * This is what an outgoing field is compared against, and it is why a
   * trailing space costs nothing: the comparison is made on the value as the
   * wire would carry it, so an edit that does not survive `textOrNull` is not
   * an edit. Without it the screen would send a body identical to the stored
   * row every time he typed a space and took it away again.
   */
  let server: VisitNotesDraft = blankVisitNotes()
  let serverPin: { lat: number; lng: number } | null = null

  /** The value as the wire would carry it. `internet` is an enum and goes as-is. */
  const onWire = (field: NoteField, from: VisitNotesDraft) =>
    field === 'internet' ? from.internet : textOrNull(from[field] as string)

  /** Nothing to send: what he has is what the server already has. */
  const settled = (field: NoteField) => onWire(field, draft) === onWire(field, server)

  const pinSettled = () =>
    (pin.value?.lat ?? null) === (serverPin?.lat ?? null) &&
    (pin.value?.lng ?? null) === (serverPin?.lng ?? null)

  /** Is anything at all waiting to go? */
  const outstanding = () =>
    pendingFields.size > 0 || pendingPin.value !== null || pendingRooms.size > 0

  /**
   * The copy on the phone, rewritten whenever the unsent work changes — and
   * taken away the moment there is none, so a later mount does not restore a
   * draft the server already has and queue it all over again.
   *
   * Every path that changes what is outstanding goes through here. It is one
   * function rather than a write at each call site because the thing that must
   * never drift is the pairing: what is on screen, and what is known to be
   * unsent, are stored together or not at all.
   */
  function persist() {
    if (!outstanding()) {
      unsent.clear(houseId)
      return
    }

    unsent.write(houseId, {
      notes: { ...draft },
      fields: [...pendingFields.entries()],
      pin: pendingPin.value === null ? null : pin.value,
      pinSpan: pendingPin.value,
      rooms: [...pendingRooms.entries()],
    })
  }

  // --- seeding ---------------------------------------------------------------

  /**
   * What he was in the middle of when the screen last went away.
   *
   * The words go back on screen **and back in the queue**, with the times they
   * were originally typed. Restoring only the words would put them in front of
   * him while the server went on holding the old ones, with nothing left to
   * notice the difference — the divergence would then last the whole session
   * and look exactly like work that had been saved.
   */
  const restored = unsent.read(houseId)

  if (restored) {
    Object.assign(draft, restored.notes)
    for (const [field, span] of restored.fields) pendingFields.set(field, span)
    if (restored.pinSpan !== null) {
      pin.value = restored.pin
      pendingPin.value = restored.pinSpan
    }
    for (const [id, edit] of restored.rooms) pendingRooms.set(id, edit)
  }

  /**
   * The house as the API holds it.
   *
   * Field by field, not all or nothing: a field he has unsent work in keeps his
   * words, and every other field takes the record's. That way a reload while
   * one field was outstanding does not pin the whole form to a stale snapshot —
   * only the part that is genuinely his.
   */
  function seed(notes: VisitNotesDraft) {
    server = { ...notes }

    const takeFromRecord = FIELD_ORDER.filter((field) => !pendingFields.has(field))
    Object.assign(
      draft,
      Object.fromEntries(takeFromRecord.map((field) => [field, notes[field]])),
    )

    // A restored edit the record turns out to already hold did reach the server
    // before the screen went away; the acknowledgement is what was lost.
    for (const field of [...pendingFields.keys()]) {
      if (settled(field)) pendingFields.delete(field)
    }

    // Synchronous, so the watcher this assignment wakes sees no change to queue.
    previous = { ...draft }

    if (pendingFields.size > 0) schedule()
    else persist()
  }

  /** The stored position. A pin he dropped and has not sent stands over it. */
  function seedPin(next: VisitPin | null) {
    serverPin = next === null ? null : { lat: next.lat, lng: next.lng }

    if (pendingPin.value === null) {
      pin.value = next
      return
    }

    if (pinSettled()) {
      pendingPin.value = null
      persist()
    } else {
      schedule()
    }
  }

  /** The rooms as read. A type he chose and has not sent stands over theirs. */
  function seedRooms(next: VisitRoom[]) {
    rooms.value = next.map((room) => {
      const mine = pendingRooms.get(room.id)
      return mine ? { ...room, type: mine.slug, guessed: false } : room
    })

    // Same as the fields: a choice the record already agrees with was sent.
    for (const [id, edit] of [...pendingRooms.entries()]) {
      const onRecord = next.find((room) => room.id === id)
      if (onRecord && onRecord.type === edit.slug) pendingRooms.delete(id)
    }

    if (pendingRooms.size > 0) flushRooms()
    persist()
  }

  // --- the house write -------------------------------------------------------

  let settle: ReturnType<typeof setTimeout> | undefined
  let inFlight = false

  /** How long the oldest unsent edit has been waiting, or null if none is. */
  function oldestPendingAt(): number | null {
    const times = [...pendingFields.values()].map((span) => span.first)
    if (pendingPin.value !== null) times.push(pendingPin.value.first)
    return times.length === 0 ? null : Math.min(...times)
  }

  const schedule = () => {
    clearTimeout(settle)

    // Something has been waiting long enough; this change goes with it rather
    // than pushing the whole batch another 2.5s down the road.
    const oldest = oldestPendingAt()
    if (oldest !== null && Date.now() - oldest >= MAX_WAIT_MS) {
      flushHouse()
      return
    }

    settle = setTimeout(flushHouse, SETTLE_MS)
  }

  /**
   * Send it now rather than when the typing settles — leaving a field, leaving
   * the screen, or putting the phone away. `beacon` lets the request outlive a
   * closing document.
   *
   * It waits a tick first, because `focusout` arrives **synchronously** while
   * the keystroke that preceded it is still in Vue's queue: the watcher that
   * puts a field in `pendingFields` runs on flush, so sending before that would
   * find nothing pending and commit the field one keystroke stale. The one case
   * that cannot afford the tick is a closing document, where there may not be
   * another one — and there the last keystroke is long since queued anyway.
   */
  function flushNow(beacon = false) {
    clearTimeout(settle)
    if (beacon) {
      flushHouse(true)
      return
    }
    nextTick(() => flushHouse(false))
  }

  async function flushHouse(beacon = false) {
    if (inFlight) return

    // An edit that does not survive the trip to the wire was never an edit: a
    // trailing space, a character typed and deleted, a chip inserted and taken
    // back out. Dropped here rather than sent, so none of them costs a request.
    for (const field of [...pendingFields.keys()]) {
      if (settled(field)) pendingFields.delete(field)
    }
    if (pendingPin.value !== null && pinSettled()) pendingPin.value = null

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
      const saved = await updateHouse(houseId, patch, beacon)

      // The answer is the whole house, so it is what the server holds rather
      // than what we hoped it would hold.
      server = toVisitNotes(saved)
      serverPin =
        saved.gps_lat === null || saved.gps_lng === null
          ? null
          : { lat: saved.gps_lat, lng: saved.gps_lng }

      for (const [field, span] of fields) {
        if (span.last <= sentAt) pendingFields.delete(field)
      }
      if (pinSpan !== null && pinSpan.last <= sentAt) pendingPin.value = null

      savedAt.value = clock(Date.now())
      refused.value = false
    } catch (error) {
      // Unreachable: it waits for signal. Refused: saying "saved" would be a
      // lie, and the words are still safe on the phone either way.
      refused.value = !isUnreachable(error)
    } finally {
      inFlight = false
      // Whatever the outcome, the phone's copy now matches what is still owed:
      // gone if the write landed, still there if it did not.
      persist()
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
      const at = Date.now()

      for (const field of FIELD_ORDER) {
        if (value[field] === previous[field]) continue
        // It moved, but back to what the server already holds — he deleted what
        // he typed, or added a space. It stops being queued, so the offline
        // list never claims something is waiting to send when nothing is.
        if (settled(field)) pendingFields.delete(field)
        else pendingFields.set(field, touch(pendingFields.get(field), at))
      }
      previous = value

      persist()
      schedule()
    },
    { deep: false },
  )

  // --- the pin ---------------------------------------------------------------

  /** Dropping one, or clearing it. Both are a change to the same two columns. */
  function setPin(next: VisitPin | null) {
    pin.value = next
    // Back to the position the record already holds — he cleared one that was
    // never his, or re-dropped where it already was. Nothing to send.
    pendingPin.value = pinSettled()
      ? null
      : touch(pendingPin.value ?? undefined, Date.now())
    persist()
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

    pendingRooms.set(roomId, {
      slug: after.type,
      span: touch(pendingRooms.get(roomId)?.span, Date.now()),
    })
    persist()
    sendRoom(roomId)
  }

  /**
   * Rooms with a request out. **One at a time, per room** — a chip is the kind
   * of thing that gets clicked three times in a row, and two `PATCH`es to the
   * same room racing can reach the server in the other order. The second answer
   * would then be the first value, leaving the record saying one thing and the
   * screen another with nothing queued to notice. Same guard as `flushHouse`'s,
   * for the same reason.
   */
  const roomsInFlight = new Set<number>()

  /**
   * One queued room type, on its way. Separate from the click so a reconnect or
   * a restored session can send it without a click to hang it off.
   */
  async function sendRoom(roomId: number) {
    // Already going. Whatever he has clicked since is in `pendingRooms`, and
    // the request in flight will send it when it lands.
    if (roomsInFlight.has(roomId)) return

    const edit = pendingRooms.get(roomId)
    if (!edit) return

    roomsInFlight.add(roomId)
    let landed = false
    try {
      await updateRoomSpace(roomId, edit.slug)
      landed = true
      // Only if he has not clicked again since: the later choice is the one
      // still owed, and deleting it here would strand it.
      if (pendingRooms.get(roomId)?.slug === edit.slug) pendingRooms.delete(roomId)
      savedAt.value = clock(Date.now())
      refused.value = false
    } catch (error) {
      // Left on screen and left queued: he saw it change, and it will go.
      refused.value = !isUnreachable(error)
    } finally {
      roomsInFlight.delete(roomId)
      persist()
      // Clicked again while that was out, so there is a newer choice owed. Only
      // after one that landed: retrying a failure here would spin, and coming
      // back online is what that case is waiting for.
      if (landed && pendingRooms.has(roomId)) sendRoom(roomId)
    }
  }

  /** Everything queued for a room, in one pass. */
  const flushRooms = () => {
    for (const roomId of [...pendingRooms.keys()]) sendRoom(roomId)
  }

  /** Anything queued goes the moment there is a connection to put it through. */
  function retry() {
    if (!outstanding()) return
    refused.value = false
    flushHouse()
    flushRooms()
  }

  /**
   * The phone going into a pocket, the tab closing, a call arriving.
   *
   * This is not a saving of requests — it is the one that makes the banner's
   * promise true. `sessionStorage` does not survive a closed tab, so without a
   * send here anything typed inside the last 2.5s would go with it. An ordinary
   * `fetch` is cancelled along with the document, which is why it goes
   * keepalive.
   */
  const onHidden = () => {
    if (document.visibilityState === 'hidden') flushNow(true)
  }

  const onPageHide = () => flushNow(true)

  window.addEventListener('pagehide', onPageHide)
  document.addEventListener('visibilitychange', onHidden)

  onScopeDispose(() => {
    clearTimeout(settle)
    window.removeEventListener('pagehide', onPageHide)
    document.removeEventListener('visibilitychange', onHidden)
    // Leaving the screen — for Rooms, or back to her page — is a commit point
    // like any other, and the component is going with it.
    flushHouse(true)
  })

  // --- what the screen reads -------------------------------------------------

  /** `saved · 14:02`, or nothing to say yet. */
  const savedLabel = computed(() => (savedAt.value ? `saved · ${savedAt.value}` : null))

  const pendingNoteCount = computed(() => pendingFields.size)
  const pendingRoomCount = computed(() => pendingRooms.size)

  /**
   * There is work of his on this screen that the record does not have.
   *
   * The view needs this to decide what to render when the house cannot be read:
   * with unsent work there is something to show — his own words, which are the
   * ones he cares about — and showing a failure over them would be the screen
   * blocking on the network, which this one never does.
   */
  const unsentWork = computed(
    () => pendingFields.size > 0 || pendingPin.value !== null || pendingRooms.size > 0,
  )

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
        at: spanLabel(widest([...pendingRooms.values()].map((edit) => edit.span))),
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
    flushNow,
    savedLabel,
    refused,
    queue,
    unsentWork,
    pendingNoteCount,
    pendingRoomCount,
  }
}
