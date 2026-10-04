import type {
  ApiHouse,
  ApiHouseUpdate,
  ApiInstalledGroup,
  ApiRoom,
  ApiRoomUpdate,
  ApiSpaceSlug,
} from '@/types/api'
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

/** `PATCH /rooms/{id}` — the one write the rooms card makes. */
export const updateRoomSpace = (roomId: number, space: ApiSpaceSlug) =>
  apiSend<ApiRoom>('PATCH', `/rooms/${roomId}`, { space_slug: space } satisfies ApiRoomUpdate)

/**
 * How many devices are in the house.
 *
 * There is no count on the wire — the endpoint answers with the devices grouped
 * by room — so the figure is the length of what came back. Removed ones do not
 * count as installed; the endpoint leaves them out by default and this says so
 * again rather than trusting it, since the difference is a number on screen.
 */
export async function fetchInstalledCount(houseId: number, signal?: AbortSignal): Promise<number> {
  const groups = await apiGet<ApiInstalledGroup[]>(
    `/houses/${houseId}/installed-devices`,
    undefined,
    signal,
  )
  return groups.reduce(
    (total, group) => total + group.devices.filter((d) => d.status !== 'removed').length,
    0,
  )
}

/** Re-exported so a caller reads the house's fields without a second import. */
export { toVisitNotes }
