import { computed, reactive, type Ref } from 'vue'
import { MOCK_ROOMS } from '@/data/houseRecordMock'
import {
  nextRoomType,
  roomCounts,
  uniqueRoomName,
  unusedCommonNames,
  type RemovedRoom,
  type Room,
} from '@/types/houseRooms'
import type { ApiSpaceSlug } from '@/types/api'

/**
 * Her rooms, for as long as the tab is open.
 *
 * Module-scoped and keyed by house, for the same reason `itemDrafts` is: two
 * screens look at the same rooms — the phone's entry list and the laptop's
 * table are one list, and the Visit notes card beside them is a third view of
 * it — and a room added on one that vanished on the next would make the tab bar
 * lie about its own count.
 *
 * ⚠️ FLAG — **nothing here is written anywhere.** The handoff's rooms carry two
 * facts the wire has no column for (a type that was guessed, and no type at
 * all), and `POST /houses/{id}/rooms` requires `space_slug`, so the room this
 * tab exists to let him add — the one he cannot name a type for — cannot be
 * created through it. Rather than write a shape that drops the half of each
 * room the design is about, the list lives here and the endpoints are left
 * alone. When `ApiRoom` can say "guessed" and "none", this file becomes the
 * three calls it is already shaped like: create, patch, delete.
 *
 * There is no save button, here or on the screens: an edit is kept the moment
 * it is made, which is what every function below does.
 */

interface HouseRooms {
  rooms: Room[]
  /** The one removal that can still be taken back. Replaced by the next one. */
  undo: RemovedRoom | null
}

const houses = reactive<Record<number, HouseRooms>>({})

/**
 * Ids for rooms that have none. Negative, and counting down, so a locally added
 * room can never collide with a record's id — and so that anything reading one
 * can tell at a glance that the server has not seen it.
 */
let nextLocalId = -1

function entry(houseId: number): HouseRooms {
  if (!houses[houseId]) {
    // Copied, not referenced: the mock is the record, and the record does not
    // change because he removed a room on screen.
    houses[houseId] = { rooms: MOCK_ROOMS.map((room) => ({ ...room })), undo: null }
  }
  return houses[houseId]
}

/**
 * What a screen holds. A reader of the rooms, and the six things that can be
 * done to one — all of which answer on screen immediately, because there is
 * nothing for them to wait for.
 */
export function useHouseRoomsStore(houseId: number) {
  const state = entry(houseId)

  const rooms = computed(() => state.rooms)
  const counts = computed(() => roomCounts(state.rooms))
  const commonNames = computed(() => unusedCommonNames(state.rooms))
  const undo = computed(() => state.undo)

  /** The rooms that still say `type?`, for the card that names them. */
  const untyped = computed(() => state.rooms.filter((room) => room.type === null))

  /**
   * One room, added at the end of the walk.
   *
   * A name already in the list becomes `Bedroom 2` rather than a question: he
   * is walking, and a dialog is a stop. The id of what was added comes back so
   * the laptop can put the caret in the new row's name and select it.
   *
   * The type is never required. No guess and nothing picked means the room is
   * added as `type?` — in amber, so it is obvious later, and saved, so getting
   * the name down is never blocked on getting the type right.
   */
  function add(name: string, type: ApiSpaceSlug | null, guessed: boolean): number | null {
    const wanted = name.trim()
    if (!wanted) return null

    const id = nextLocalId--
    state.rooms.push({ id, name: uniqueRoomName(state.rooms, wanted), type, guessed })
    // The strip said what the last removal was. A new room is a new event, and
    // the offer to undo the old one goes with it.
    state.undo = null
    return id
  }

  /** The laptop's inline field, which is the only way a room is renamed. */
  function rename(id: number, name: string) {
    const room = state.rooms.find((candidate) => candidate.id === id)
    // Blank is not a rename: an empty field is on its way somewhere, and the
    // row keeps the name it had until it gets there.
    if (room && name.trim()) room.name = name.trim()
  }

  /** One click on the laptop: this type, and it is his. No cycling at the desk. */
  function setType(id: number, type: ApiSpaceSlug) {
    const room = state.rooms.find((candidate) => candidate.id === id)
    if (!room) return
    room.type = type
    room.guessed = false
  }

  /** One tap on the phone: confirm a guess, advance a type, give a blank the first. */
  function cycle(id: number) {
    const at = state.rooms.findIndex((candidate) => candidate.id === id)
    if (at !== -1) state.rooms[at] = nextRoomType(state.rooms[at])
  }

  /**
   * Gone now, with no dialog in front of it. The strip underneath is the whole
   * of the confirmation, and it holds the room *and where it was* so undo puts
   * it back in walk order rather than at the end.
   */
  function remove(id: number) {
    const at = state.rooms.findIndex((candidate) => candidate.id === id)
    if (at === -1) return
    const [room] = state.rooms.splice(at, 1)
    state.undo = { room, at }
  }

  /** The strip's other half. */
  function undoRemove() {
    if (!state.undo) return
    state.rooms.splice(state.undo.at, 0, state.undo.room)
    state.undo = null
  }

  return {
    rooms: rooms as Readonly<Ref<Room[]>>,
    counts,
    commonNames,
    untyped,
    undo,
    add,
    rename,
    setType,
    cycle,
    remove,
    undoRemove,
  }
}
