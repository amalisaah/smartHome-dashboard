import { computed, reactive, ref, watch } from 'vue'
import { INTERNET_VALUES, blankVisitNotes, type VisitNotesDraft } from '@/types/houseVisit'
import { isRecord, sessionFamily, type Validator } from '@/utils/storage'

/**
 * What he types in her house, and where it lives while he types it.
 *
 * There is no save button on block A and there is no `PATCH /houses/{id}` to
 * press one against, so this is the whole of saving: every keystroke goes
 * straight into session storage, keyed by the house, and the header says the
 * time it last went. That is not a stand-in for a request — it is what the
 * screen's own footer promises ("Every keystroke kept on this phone"), and it
 * is why the screen never waits on the network and never disables a field when
 * the connection drops.
 *
 * TODO(api): when `PATCH /houses/{id}` exists it goes *behind* this, not in
 * front of it: the draft is still written locally first and the request is what
 * drains it. Nothing above this file should learn about the network.
 */

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

/** `14:02` — the stamp the phone header carries, as the rest of the app says one. */
const CLOCK = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function useVisitNotes(houseId: number) {
  const draft = reactive<VisitNotesDraft>(blankVisitNotes())

  /** When it last went to the phone. Null until he has changed something. */
  const keptAt = ref<string | null>(null)

  /**
   * Whether anything he typed is in here, as opposed to what the house arrived
   * holding. Half-finished work outranks the record: he typed it after the read
   * came back, so seeding over it would take words off the screen.
   */
  const dirty = ref(false)

  const stored = drafts.read(houseId)
  if (stored) {
    Object.assign(draft, stored)
    dirty.value = true
  }

  /**
   * The house as the API holds it, arriving a moment after the screen. Ignored
   * once he has typed: what he is writing outranks what was stored, and seeding
   * over it would take words off the screen in front of him.
   */
  let seeding = false

  function seed(notes: VisitNotesDraft) {
    if (dirty.value) return
    seeding = true
    Object.assign(draft, notes)
  }

  // Every keystroke, not every pause: there is no request to debounce, and a
  // write that waits is a write a closed tab loses.
  watch(
    () => ({ ...draft }),
    (value) => {
      // The read landing is not a change he made, so it neither writes nor
      // stamps a time. The flag is cleared here rather than by a timer: this
      // runs once, in the same flush as the assignment that set it.
      if (seeding) {
        seeding = false
        return
      }

      dirty.value = true
      drafts.write(houseId, value)
      keptAt.value = CLOCK.format(new Date())
    },
    { deep: false },
  )

  /** `saved · 14:02`, or nothing to say yet. */
  const savedLabel = computed(() => (keptAt.value ? `saved · ${keptAt.value}` : null))

  return { draft, savedLabel, seed }
}
