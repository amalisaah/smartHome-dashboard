import { computed, onScopeDispose, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { archiveRoom, createRoom, updateRoomName, updateRoomSpace } from '@/api/houses'
import { houseKeys } from '@/api/hooks/houses'
import { ApiRequestError } from '@/api/http'
import { toVisitRoom } from '@/utils/mapper/houseVisitMapper'
import type { ApiRoom } from '@/types/api'
import {
  nextRoomType,
  roomCounts,
  uniqueRoomName,
  unusedCommonNames,
  type RemovedRoom,
  type Room,
} from '@/types/houseRooms'
import { isFiniteNumber, sessionValue, type Validator } from '@/utils/storage'
import type { ApiSpaceSlug } from '@/types/api'

/**
 * Her rooms, and everything that happens to one.
 *
 * There is no save button on either frame, so this is the whole of saving. A
 * change goes on screen first and to the API after — a type chip is the kind of
 * thing that gets tapped three times in a row, and a list that waited on each
 * tap would feel broken standing in someone's hallway.
 *
 * **Three places the design and the wire do not meet**, each marked where it
 * bites rather than papered over:
 *
 *   1. **`guessed` has no column.** `ApiRoom.space_slug` is required and says
 *      nothing about having been inferred, so the dashed chip — the one that
 *      tells him which types are worth checking — cannot be read back. It is
 *      remembered on this device instead (see `guesses` below), which keeps the
 *      walk working and still loses it when he opens the laptop.
 *   2. **A room with no type cannot be created.** `POST /houses/{id}/rooms`
 *      requires `space_slug`. The design's promise is that the name goes down
 *      first and the type is never required, so an untyped room is **held**
 *      here, shown in amber as `type?`, and sent the moment he gives it one.
 *   3. **`DELETE` archives and nothing un-archives.** So the removal waits as
 *      long as the undo offer does, and only goes when the offer is gone.
 */

/** A room the wire has not seen yet, because it has no type to be created with. */
const isHeld = (room: Room) => room.id < 0

/**
 * The guesses this device remembers, by room id.
 *
 * ⚠️ FLAG — this is a **stand-in for a column**. It is right on the phone he
 * walked the house with and wrong everywhere else, which is exactly as far as a
 * browser can carry a fact about the record. When `ApiRoom` can say a slug was
 * inferred, this goes and `toVisitRoom` reads it instead.
 *
 * Session rather than local: a guess he has not corrected is unfinished work,
 * and unfinished work does not outlive the tab it was made in.
 */
const isIdList: Validator<number[]> = (raw) => {
  if (!Array.isArray(raw)) return null
  const ids: number[] = []
  for (const entry of raw) {
    const id = isFiniteNumber(entry)
    if (id === null) return null
    ids.push(id)
  }
  return ids
}

export function useHouseRoomsEditor(houseId: number) {
  /**
   * The cache is kept in step with what was written rather than re-read after
   * it. Every one of these endpoints answers with the room it changed, so the
   * list can be corrected exactly — and a type chip, which gets tapped three
   * times in a row, costs no `GET` at all. The view still owns the read; this
   * only stops the cached copy from contradicting a write it just made.
   */
  const queryClient = useQueryClient()

  const cacheKey = houseKeys.rooms(houseId)

  const patchCache = (change: (rooms: Room[]) => Room[]) =>
    queryClient.setQueryData<Room[]>(cacheKey, (cached) => change(cached ? [...cached] : []))

  const cacheUpsert = (api: ApiRoom) =>
    patchCache((cached) => {
      const room = toVisitRoom(api)
      const at = cached.findIndex((candidate) => candidate.id === room.id)
      if (at === -1) return [...cached, room]
      cached[at] = room
      return cached
    })

  const cacheDrop = (id: number) =>
    patchCache((cached) => cached.filter((room) => room.id !== id))

  const guessStore = sessionValue<number[]>(`house-room-guesses:${houseId}`, isIdList)
  const guesses = ref(new Set(guessStore.readOr([])))

  const persistGuesses = () => guessStore.write([...guesses.value])

  /** What is on screen. Seeded by the read, and ahead of it while a write is out. */
  const rooms = ref<Room[]>([])

  /** The one removal that can still be taken back. Replaced by the next event. */
  const undo = ref<RemovedRoom | null>(null)

  /** A write was refused, as opposed to never having left the phone. */
  const refused = ref(false)

  /** When the last write landed — what the laptop's app bar reads. */
  const savedAt = ref<string | null>(null)

  /** Ids for rooms the server has not minted one for. Negative, so never a clash. */
  let nextHeldId = -1

  const CLOCK = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  /** A write that never reached the server is not a write that was refused. */
  const isUnreachable = (error: unknown) =>
    error instanceof ApiRequestError ? error.isNetworkFailure || error.status >= 500 : true

  function landed() {
    savedAt.value = CLOCK.format(new Date())
    refused.value = false
  }

  function failed(error: unknown) {
    refused.value = !isUnreachable(error)
  }

  // --- the read ---------------------------------------------------------------

  /**
   * The rooms as the API holds them.
   *
   * Rooms being held here — the untyped ones, which the wire cannot carry — are
   * kept across the seed, in the position they were entered. Everything else
   * takes the record's word: it is the only copy that outlives the tab.
   */
  function seed(next: readonly Room[]) {
    const held = rooms.value.filter(isHeld)
    const fromRecord = next.map((room) => ({
      ...room,
      guessed: guesses.value.has(room.id),
    }))

    rooms.value = [...fromRecord, ...held]

    // A guess for a room that is no longer in the house is a guess about
    // nothing; dropped here so the set does not grow for the tab's lifetime.
    const live = new Set(next.map((room) => room.id))
    let dropped = false
    for (const id of [...guesses.value]) {
      if (!live.has(id)) {
        guesses.value.delete(id)
        dropped = true
      }
    }
    if (dropped) persistGuesses()
  }

  // --- adding -----------------------------------------------------------------

  /**
   * One room, at the end of the walk.
   *
   * It is on screen before the request goes, because he is already at the next
   * door. A duplicate name becomes `Bedroom 2` rather than a question — asking
   * is a stop, and there is no uniqueness rule on the wire to defer to.
   *
   * With no type it is **held**: `POST` requires `space_slug`, and the screen
   * will not invent one. It sits in the list in amber and goes when he says
   * what it is.
   */
  async function add(name: string, type: ApiSpaceSlug | null, guessed: boolean) {
    const wanted = name.trim()
    if (!wanted) return

    // The strip offered to undo the last removal. A new room is a new event,
    // and the removal it was holding goes with the offer.
    commitRemoval()

    const unique = uniqueRoomName(rooms.value, wanted)
    const heldId = nextHeldId--
    rooms.value = [...rooms.value, { id: heldId, name: unique, type, guessed }]

    if (type === null) return
    await send(heldId, unique, type, guessed)
  }

  /** The held room's trip to the wire, and the real id it comes back with. */
  async function send(heldId: number, name: string, type: ApiSpaceSlug, guessed: boolean) {
    try {
      const created = await createRoom(houseId, name, type)
      cacheUpsert(created)

      // He may have renamed or re-typed it while the request was out; what is on
      // screen is the later word, so only the id is taken from the answer.
      rooms.value = rooms.value.map((room) =>
        room.id === heldId ? { ...room, id: created.id } : room,
      )

      if (guessed) {
        guesses.value.delete(heldId)
        guesses.value.add(created.id)
        persistGuesses()
      }
      landed()
    } catch (error) {
      // Left on screen and left held: he saw it appear, and it goes when there
      // is a connection to put it through.
      failed(error)
    }
  }

  // --- changing ---------------------------------------------------------------

  /** The laptop's inline field, which is the only way a room is renamed. */
  async function rename(id: number, name: string) {
    const wanted = name.trim()
    const room = rooms.value.find((candidate) => candidate.id === id)
    // Blank is not a rename: an empty field is on its way somewhere, and the
    // row keeps the name it had until it gets there.
    if (!room || !wanted || wanted === room.name) return

    rooms.value = rooms.value.map((r) => (r.id === id ? { ...r, name: wanted } : r))

    // A held room has no id to PATCH. Its name goes with the create.
    if (isHeld(room)) return

    try {
      cacheUpsert(await updateRoomName(id, wanted))
      landed()
    } catch (error) {
      failed(error)
    }
  }

  /**
   * A type, settled. One click at the desk; one of the cycle's steps on the
   * phone.
   *
   * Confirming a guess sends nothing — `space_slug` was already this value, it
   * was only this device that called it uncertain. What it does change is the
   * remembered guess, which is the whole of what confirming means here.
   */
  async function setType(id: number, type: ApiSpaceSlug) {
    const room = rooms.value.find((candidate) => candidate.id === id)
    if (!room) return

    const slugChanged = room.type !== type
    rooms.value = rooms.value.map((r) => (r.id === id ? { ...r, type, guessed: false } : r))

    if (guesses.value.delete(id)) persistGuesses()

    // The room the wire has never seen. Giving it a type is what lets it go.
    if (isHeld(room)) {
      await send(room.id, room.name, type, false)
      return
    }

    if (!slugChanged) return

    try {
      cacheUpsert(await updateRoomSpace(id, type))
      landed()
    } catch (error) {
      failed(error)
    }
  }

  /** One tap on the phone: confirm a guess, advance a type, give a blank the first. */
  function cycle(id: number) {
    const room = rooms.value.find((candidate) => candidate.id === id)
    if (!room) return
    const after = nextRoomType(room)
    // `nextRoomType` only ever hands back a slug: a blank takes the first one.
    if (after.type !== null) void setType(id, after.type)
  }

  // --- removing ---------------------------------------------------------------

  /**
   * Gone from the list now, with no dialog in front of it — the strip
   * underneath is the whole of the confirmation.
   *
   * The request does **not** go yet. `DELETE` archives and nothing un-archives,
   * so a removal sent now could only be undone by creating a second room with a
   * new id, which would leave this room's installed devices pointing at the
   * archived one. The archive therefore waits exactly as long as the offer to
   * undo it does.
   */
  function remove(id: number) {
    const at = rooms.value.findIndex((room) => room.id === id)
    if (at === -1) return

    commitRemoval()

    const room = rooms.value[at]
    rooms.value = rooms.value.filter((candidate) => candidate.id !== id)
    undo.value = { room, at }
  }

  /** The strip's other half. Nothing was sent, so there is nothing to take back. */
  function undoRemove() {
    const held = undo.value
    if (!held) return

    const next = [...rooms.value]
    next.splice(Math.min(held.at, next.length), 0, held.room)
    rooms.value = next
    undo.value = null
  }

  /**
   * The offer has expired — he added something, removed something else, or left
   * the screen. Now the archive goes.
   *
   * A room that was only ever held here never reached the wire, so there is
   * nothing to archive; it simply stops existing.
   */
  function commitRemoval(beacon = false) {
    const held = undo.value
    if (!held) return
    undo.value = null

    // Only ever held here, so there is nothing on the wire to archive.
    if (isHeld(held.room)) return

    if (guesses.value.delete(held.room.id)) persistGuesses()

    archiveRoom(held.room.id, beacon).then(() => {
      cacheDrop(held.room.id)
      landed()
    }, failed)
  }

  /**
   * The tab closing, the phone going into a pocket, a hard navigation.
   *
   * Without this the deferred archive goes with the document: an ordinary
   * `fetch` is cancelled along with the page that started it, so a room he
   * removed and then navigated away from would come back on the next read.
   * `keepalive` lets the request outlive the document, which is the same answer
   * the Visit notes screen gives its last keystroke.
   */
  const onPageHide = () => commitRemoval(true)
  const onHidden = () => {
    if (document.visibilityState === 'hidden') commitRemoval(true)
  }

  window.addEventListener('pagehide', onPageHide)
  document.addEventListener('visibilitychange', onHidden)

  // Leaving the screen within the app is a commit point like any other, and the
  // component is going with it.
  onScopeDispose(() => {
    window.removeEventListener('pagehide', onPageHide)
    document.removeEventListener('visibilitychange', onHidden)
    commitRemoval(true)
  })

  // --- what the screens read --------------------------------------------------

  const counts = computed(() => roomCounts(rooms.value))
  const commonNames = computed(() => unusedCommonNames(rooms.value))
  const untyped = computed(() => rooms.value.filter((room) => room.type === null))

  /** `saved · 14:02`, or nothing to say yet. */
  const savedLabel = computed(() => (savedAt.value ? `saved · ${savedAt.value}` : null))

  /**
   * Work of his the record does not have. The untyped rooms, which the wire
   * cannot take until they have a type.
   */
  const heldCount = computed(() => rooms.value.filter(isHeld).length)

  return {
    rooms,
    counts,
    commonNames,
    untyped,
    undo,
    heldCount,
    refused,
    savedLabel,
    seed,
    add,
    rename,
    setType,
    cycle,
    remove,
    undoRemove,
  }
}
