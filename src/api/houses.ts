import type {
  ApiHouse,
  ApiHouseUpdate,
  ApiInstalledDevice,
  ApiInstalledGroup,
  ApiRoom,
  ApiRoomUpdate,
  ApiSpaceSlug,
} from '@/types/api'

/** The three a row can be in. There is no action that puts one back to active. */
type ApiDeviceStatus = ApiInstalledDevice['status']
import type { VisitNotesDraft, VisitPin, VisitRoom } from '@/types/houseVisit'
import { toVisitNotes, toVisitRoom } from '@/utils/mapper/houseVisitMapper'
import { apiGet, apiSend } from './http'

/**
 * The house as its own resource.
 *
 * `/houses/{id}` rather than `/customers/{id}/houses/{id}`: a house belongs to a
 * customer but is addressed on its own, and so are its rooms and its devices.
 * That is also why this is a file beside `customers.ts` rather than more of it.
 */

/** `GET /houses/{id}`. */
export const fetchHouse = (id: number, signal?: AbortSignal) =>
  apiGet<ApiHouse>(`/houses/${id}`, undefined, signal)

/**
 * `PATCH /houses/{id}` — what the Visit notes screen writes.
 *
 * Only changed fields go. The endpoint leaves omitted ones untouched, which is
 * exactly what a screen with no save button needs: two fields edited a minute
 * apart are two small requests, and neither can clobber the other's value.
 *
 * Blanks go as `null` rather than `""`, as everywhere else on this module — an
 * address nobody wrote down is not an empty address.
 */
export const updateHouse = (id: number, patch: ApiHouseUpdate, keepalive?: boolean) =>
  apiSend<ApiHouse>('PATCH', `/houses/${id}`, patch, undefined, keepalive)

/**
 * A field's value on the way out: empty becomes absent.
 *
 * Exported because it is also what decides whether a field is worth sending at
 * all. The screen compares **this** against what the server last confirmed, not
 * the raw text — otherwise a trailing space, or a character typed and deleted,
 * would each cost a round trip carrying a body identical to the stored row.
 */
export const textOrNull = (value: string) => value.trim() || null

/** The six note fields as the wire names them. */
export function toHousePatch(fields: Partial<VisitNotesDraft>): ApiHouseUpdate {
  const patch: ApiHouseUpdate = {}
  if (fields.directions !== undefined) patch.landmark_directions = textOrNull(fields.directions)
  if (fields.address !== undefined) patch.address_text = textOrNull(fields.address)
  if (fields.access !== undefined) patch.access_notes = textOrNull(fields.access)
  if (fields.wiring !== undefined) patch.wiring_notes = textOrNull(fields.wiring)
  if (fields.internet !== undefined) patch.internet_quality = fields.internet
  if (fields.internetNote !== undefined) patch.internet_notes = textOrNull(fields.internetNote)
  return patch
}

/** The pin as the wire holds it: a position, and nothing about the reading. */
export const toPinPatch = (pin: VisitPin | null): ApiHouseUpdate =>
  pin === null
    ? { gps_lat: null, gps_lng: null }
    : { gps_lat: pin.lat, gps_lng: pin.lng }

/**
 * `GET /houses/{id}/rooms` — the house's rooms in `sort_order`, archived ones
 * left out, which is the endpoint's own default.
 */
export async function fetchRooms(houseId: number, signal?: AbortSignal): Promise<VisitRoom[]> {
  const rooms = await apiGet<ApiRoom[]>(`/houses/${houseId}/rooms`, undefined, signal)
  return rooms.map(toVisitRoom)
}

/** `PATCH /rooms/{id}` — the write both the Visit notes card and block B make. */
export const updateRoomSpace = (roomId: number, space: ApiSpaceSlug) =>
  apiSend<ApiRoom>('PATCH', `/rooms/${roomId}`, { space_slug: space } satisfies ApiRoomUpdate)

/** `PATCH /rooms/{id}` — the laptop's inline field, which is the only rename. */
export const updateRoomName = (roomId: number, name: string) =>
  apiSend<ApiRoom>('PATCH', `/rooms/${roomId}`, { name } satisfies ApiRoomUpdate)

/**
 * `POST /houses/{id}/rooms` — one room, at the end of the walk.
 *
 * ⚠️ **`space_slug` is required**, and that is the one place block B does not
 * fit the wire: the design's whole promise is that the type is never required,
 * and an unguessable name is added as `type?` in amber. A room in that state
 * cannot be created here at all, so the screen holds it and sends it when he
 * gives it a type. See `useHouseRoomsEditor`.
 *
 * `sort_order` is left off: the endpoint puts a new room at the end, which is
 * where the next door he walks through belongs.
 */
export const createRoom = (houseId: number, name: string, space: ApiSpaceSlug) =>
  apiSend<ApiRoom>('POST', `/houses/${houseId}/rooms`, { name, space_slug: space })

/**
 * `DELETE /rooms/{id}` — which **archives** rather than deletes.
 *
 * ⚠️ There is no un-archive: `PATCH /rooms/{id}` takes a name, a slug and a
 * sort order, and nothing clears `archived_at`. So Undo cannot be a second
 * request — re-creating would mint a new id and leave the room's installed
 * devices pointing at the archived one. The screen therefore holds the removal
 * for as long as the undo offer stands and only sends it once the offer is
 * gone; see `useHouseRoomsEditor`.
 */
export const archiveRoom = (roomId: number, keepalive?: boolean) =>
  apiSend<ApiRoom>('DELETE', `/rooms/${roomId}`, undefined, undefined, keepalive)

/**
 * `GET /houses/{id}/installed-devices` — every row, whatever its status.
 *
 * ⚠️ `include_removed` is not optional for this screen. The parameter is
 * documented as letting removed rows through, but the default view also drops
 * **faulty** ones — so without it a house with a broken bulb reads as a house
 * with nothing wrong, on the screen whose whole job is to say a bulb is broken.
 * The statuses are told apart here instead.
 */
export const fetchInstalledGroups = (houseId: number, signal?: AbortSignal) =>
  apiGet<ApiInstalledGroup[]>(
    `/houses/${houseId}/installed-devices`,
    { include_removed: 'true' },
    signal,
  )

// --- what the Installed tab writes ------------------------------------------

/**
 * `PATCH /installed-devices/{id}` — how many of this thing there are.
 *
 * ⚠️ `quantity` has an exclusive minimum of 0, and there is **no delete**. So a
 * row can never be emptied: the last unit of a status cannot be stepped away,
 * only flipped to another status with the actions below. See
 * `useHouseInstalledEditor`, which guards the three steppers this blocks.
 */
export const setDeviceQuantity = (deviceId: number, quantity: number) =>
  apiSend<ApiInstalledDevice>('PATCH', `/installed-devices/${deviceId}`, { quantity })

/**
 * `POST /houses/{id}/installed-devices` — a row that did not exist.
 *
 * `job_id` is left off, which is what makes the line read `by hand`: this
 * endpoint is here so the owner can record houses he fitted before the jobs
 * module landed, and a row with no job is exactly that.
 */
export const createDevice = (
  houseId: number,
  device: { item_id: number; room_id: number | null; quantity: number; status: ApiDeviceStatus },
) => apiSend<ApiInstalledDevice>('POST', `/houses/${houseId}/installed-devices`, device)

/** `POST /installed-devices/{id}/faulty` — the whole row, broken. */
export const markDeviceFaulty = (deviceId: number) =>
  apiSend<ApiInstalledDevice>('POST', `/installed-devices/${deviceId}/faulty`)

/** `POST /installed-devices/{id}/remove` — the whole row, off the wall. */
export const markDeviceRemoved = (deviceId: number) =>
  apiSend<ApiInstalledDevice>('POST', `/installed-devices/${deviceId}/remove`)

/** Re-exported so a caller reads the house's fields without a second import. */
export { toVisitNotes }
