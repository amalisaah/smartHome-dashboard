import { computed, ref, watch } from 'vue'
import { guessRoomType } from '@/types/houseRooms'
import { ROOM_TYPES } from '@/types/houseVisit'
import { isFiniteNumber, isRecord, isString, sessionFamily, type Validator } from '@/utils/storage'
import type { ApiSpaceSlug } from '@/types/api'

/**
 * The room being typed, and nothing else.
 *
 * Both devices enter a room the same way and this is that way: a name, a guess
 * the system makes as the name arrives, and a type he can pick over the guess.
 * The field never closes on either of them, so there is no "open", no "cancel"
 * and no commit button in here — only `take()`, which hands back what is in the
 * field and empties it for the next door.
 *
 * **The type is never required.** No guess and nothing picked is a room with no
 * type, and that is a room the list takes. Getting the name down beats getting
 * it right, and `type?` in amber is what says so later.
 *
 * What it is kept for: he is standing in someone's house with the keyboard up,
 * and a call arrives. Session storage, keyed by house, so the half-typed name
 * is still in the box afterwards — which is the whole of B2's resume card.
 */

interface StoredEntry {
  text: string
  /** Only what he picked. A guess is remade from the text on the way back in. */
  picked: ApiSpaceSlug | null
  /** When it was last touched, epoch millis — the time the resume card names. */
  at: number
}

const isEntry: Validator<StoredEntry> = (raw) => {
  const record = isRecord(raw)
  if (!record) return null

  const text = isString(record.text)
  const at = isFiniteNumber(record.at)
  if (text === null || at === null) return null

  // A slug from an older build is dropped rather than carried: it would put a
  // chip in the picked state with a word the control cannot offer.
  if (record.picked !== null) {
    const picked = ROOM_TYPES.find((slug) => slug === record.picked)
    if (picked === undefined) return null
    return { text, picked, at }
  }

  return { text, picked: null, at }
}

const stored = sessionFamily<StoredEntry>('house-rooms-entry', isEntry)

const CLOCK = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** What he was in the middle of when the screen last went away. */
export interface ResumedEntry {
  text: string
  /** `14:03`. */
  at: string
}

/** One room on its way into the list. */
export interface TakenRoom {
  name: string
  type: ApiSpaceSlug | null
  /** True when the type is the system's word rather than his. */
  guessed: boolean
}

export function useRoomEntry(houseId: number) {
  const restored = stored.read(houseId)

  const text = ref(restored?.text ?? '')
  const picked = ref<ApiSpaceSlug | null>(restored?.picked ?? null)

  /**
   * B2's resume card, and the only thing that raises it. It is an
   * acknowledgement rather than a state: committing the room or emptying the
   * field is him having picked the thread back up, and it goes.
   */
  const resumed = ref<ResumedEntry | null>(
    restored && restored.text.trim()
      ? { text: restored.text, at: CLOCK.format(new Date(restored.at)) }
      : null,
  )

  /** What the system makes of the name so far. Null when it says nothing. */
  const guess = computed(() => guessRoomType(text.value))

  /** His pick stands over the guess; the guess stands over nothing. */
  const type = computed(() => picked.value ?? guess.value)

  /** Whether that type is the system's word — which is what draws it dashed. */
  const guessed = computed(() => picked.value === null && guess.value !== null)

  /** Nothing is being typed, so there is nothing to add. */
  const empty = computed(() => text.value.trim() === '')

  function persist() {
    if (empty.value && picked.value === null) {
      stored.clear(houseId)
      return
    }
    stored.write(houseId, { text: text.value, picked: picked.value, at: Date.now() })
  }

  watch([text, picked], persist)

  /**
   * One tap on a draft chip. Tapping the picked one again unpicks it, which
   * falls back to the guess — there is no third state, and no way to end up
   * with a type he cannot see the reason for.
   */
  function pick(slug: ApiSpaceSlug) {
    picked.value = picked.value === slug ? null : slug
  }

  /**
   * What is in the field, and the field emptied behind it.
   *
   * Null for an empty or whitespace-only entry: a stray return does nothing,
   * which is what keeps leaning on the key from filling the house with blanks.
   */
  function take(): TakenRoom | null {
    if (empty.value) return null

    const taken: TakenRoom = {
      name: text.value.trim(),
      type: type.value,
      guessed: guessed.value,
    }

    text.value = ''
    picked.value = null
    resumed.value = null
    return taken
  }

  /** He has read the card. It says its piece once. */
  const dismissResume = () => (resumed.value = null)

  return { text, picked, guess, type, guessed, empty, resumed, pick, take, dismissResume }
}
