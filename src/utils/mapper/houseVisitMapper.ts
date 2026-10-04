import type { ApiHouse } from '@/types/api'
import type { VisitNotesDraft, VisitPin } from '@/types/houseVisit'

/**
 * Wire → the Visit notes screen. The counterpart to `toHouseListItem`, which
 * deliberately drops everything this one exists to keep: a house's address,
 * directions, access, wiring and GPS belong *inside* the house, and this is
 * inside the house.
 *
 * `null` becomes `''` here and only here. The wire's distinction between "no
 * address was ever written down" and "the address is the empty string" is real
 * and is kept on the way out (see `createHouse`); a textarea has no way to show
 * it, so it is flattened at the edge rather than carried into the screen.
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
 * `ApiHouse` has `gps_lat` and `gps_lng` and no accuracy, no timestamp and no
 * record of which device dropped it — so a pin read back from the API has no
 * provenance to show. Rather than invent an accuracy, the two missing halves are
 * handed over empty and the row renders what it has; `visitContextMock` is where
 * a complete one comes from until the endpoint carries them.
 *
 * Half a coordinate is not a position, so a house with one of the two set has
 * no pin at all.
 */
export function toVisitPin(api: ApiHouse): Omit<VisitPin, 'accuracyM' | 'time'> | null {
  if (api.gps_lat === null || api.gps_lng === null) return null
  return { lat: api.gps_lat, lng: api.gps_lng }
}
