import type { ApiHouse, ApiRoom } from '@/types/api'
import type { VisitNotesDraft, VisitPin, VisitRoom } from '@/types/houseVisit'

/**
 * Wire → the Visit notes screen. The counterpart to `toHouseListItem`, which
 * deliberately drops everything this one exists to keep: a house's address,
 * directions, access, wiring and GPS belong *inside* the house, and this is
 * inside the house.
 *
 * `null` becomes `''` here and only here. The wire's distinction between "no
 * address was ever written down" and "the address is the empty string" is real
 * and is kept on the way out (see `toHousePatch`); a textarea has no way to
 * show it, so it is flattened at the edge rather than carried into the screen.
 */
export function toVisitNotes(api: ApiHouse): VisitNotesDraft {
  return {
    directions: api.landmark_directions ?? '',
    address: api.address_text ?? '',
    access: api.access_notes ?? '',
    wiring: api.wiring_notes ?? '',
    internet: api.internet_quality,
    internetNote: api.internet_notes ?? '',
  }
}

/**
 * The pin as the wire can state it, which is a position and nothing else.
 *
 * ⚠️ FLAG: there is no accuracy and no timestamp on `ApiHouse`, so a pin read
 * back has no provenance to show. Both are handed over null rather than filled
 * in — the row then renders the coordinates alone, which is the whole of what
 * is actually known.
 *
 * Half a coordinate is not a position, so a house with one of the two set has
 * no pin at all.
 */
export function toVisitPin(api: ApiHouse): VisitPin | null {
  if (api.gps_lat === null || api.gps_lng === null) return null
  return { lat: api.gps_lat, lng: api.gps_lng, accuracyM: null, time: null }
}

/**
 * One room, as the card lists it.
 *
 * ⚠️ FLAG: `guessed` is always false. `space_slug` is required on the wire and
 * carries nothing to say it was inferred from the name, so the dashed "guessed"
 * chip the design draws cannot be produced from an API room. Inferring it here
 * — matching `Kitchen` against `kitchen`, say — would be exactly the business
 * rule the handoff says this screen does not own, so it is left alone and
 * flagged instead.
 */
export function toVisitRoom(api: ApiRoom): VisitRoom {
  return { id: api.id, name: api.name, type: api.space_slug, guessed: false }
}
