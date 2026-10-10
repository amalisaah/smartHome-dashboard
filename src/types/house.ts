import type { ApiInternetQuality } from '@/types/api'

/**
 * What the house's phone header says about the record it is sitting over.
 *
 * One line in one place, on all three tabs, because the question it answers is
 * the same on all three: where has what I just did got to. Visit notes says
 * `saved · 14:02`, Rooms counts them, Installed dates the job that wrote it.
 *
 * `dot` is whether there is one at all. A dot marks something that *happened* —
 * a save, a connection dropping. `updated by job · 14 Aug` is a fact about the
 * record and gets none, because a dot beside it would read as news.
 */
export interface HeaderStatus {
  label: string
  /** `action` says it is kept; `risk`, that it is held here; `quiet`, neither. */
  tone: 'action' | 'risk' | 'quiet'
  dot: boolean
}

/**
 * A house as the form that starts one holds it.
 *
 * `POST /customers/{id}/houses` requires nothing at all, and this honours that:
 * no field is mandatory. What it refuses is a wholly empty save, which would
 * create a record saying nothing about anywhere.
 *
 * Every field is a string because every field is typed. The one that is not a
 * string on the wire — the GPS pair — is held as he pastes it and split on the
 * way out; see `parseGps`.
 */
export interface HouseDraft {
  label: string
  addressText: string
  landmarkDirections: string
  /** `5.6295, -0.1712`, as pasted off a map. Split into two numbers to send. */
  gps: string
  accessNotes: string
  wiringNotes: string
  internetQuality: ApiInternetQuality
  internetNotes: string
  notes: string
}

/** A house nobody has been to yet knows nothing about its internet. */
export const blankHouseDraft = (): HouseDraft => ({
  label: '',
  addressText: '',
  landmarkDirections: '',
  gps: '',
  accessNotes: '',
  wiringNotes: '',
  internetQuality: 'unknown',
  internetNotes: '',
  notes: '',
})

/** What the select offers, in the order a site visit answers the question. */
export const INTERNET_QUALITY_OPTIONS: { label: string; value: ApiInternetQuality }[] = [
  { label: 'Not known yet', value: 'unknown' },
  { label: 'Reliable', value: 'reliable' },
  { label: 'Weak', value: 'weak' },
  { label: 'None', value: 'none' },
]

/**
 * The pasted coordinates as two numbers, `null` for an empty field, and
 * `'invalid'` for something typed that is not a pair of coordinates.
 *
 * A map gives them as `5.6295, -0.1712`; a comma, whitespace or both are all
 * accepted because all three are what comes off a paste. Nothing is guessed from
 * a single number — a latitude without a longitude is not a position.
 */
export type ParsedGps = { lat: number; lng: number } | null | 'invalid'

export function parseGps(raw: string): ParsedGps {
  const text = raw.trim()
  if (text === '') return null

  const parts = text.split(/[,\s]+/).filter(Boolean)
  if (parts.length !== 2) return 'invalid'

  const [lat, lng] = parts.map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'invalid'
  // Off the globe is a typo, not a place.
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return 'invalid'

  return { lat, lng }
}

/**
 * Whether there is anything here worth writing. `internetQuality` is excluded
 * on purpose: it starts at `unknown`, so counting it would make every blank
 * form look filled in.
 */
export const isHouseDraftEmpty = (draft: HouseDraft) =>
  [
    draft.label,
    draft.addressText,
    draft.landmarkDirections,
    draft.gps,
    draft.accessNotes,
    draft.wiringNotes,
    draft.internetNotes,
    draft.notes,
  ].every((value) => value.trim() === '') && draft.internetQuality === 'unknown'
