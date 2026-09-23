import { reactive } from 'vue'
import type { ItemDraft } from '@/types/item'

/**
 * Unsaved item edits, held for the tab's lifetime.
 *
 * The item screen has no save-on-blur: what he types goes here, and nothing
 * reaches the API until he presses Save. That needs somewhere shared to live,
 * because two screens can be looking at the same item — the laptop's detail
 * columns and the phone's Edit route — and a draft that existed on only one of
 * them would be lost by navigating between them.
 *
 * **Session, not local.** A half-finished edit is worth surviving a reload or a
 * mistaken Back; it is not worth surviving until next week, when the figures it
 * was typed against have moved. Closing the tab is the end of it.
 *
 * Storage is a convenience and never a requirement: every access is guarded, and
 * a browser that refuses it simply loses the draft on reload rather than
 * breaking the screen.
 */

const KEY_PREFIX = 'item-draft:'

/** What one unsaved edit is: every field he types, and the price he decided. */
export interface ItemDraftEntry {
  fields: ItemDraft
  /**
   * The override exactly as typed, so a half-typed figure survives a reload the
   * same way a half-typed name does. Empty means "back to the group default".
   */
  override: string
  /** When it was last touched. The header counts from this. */
  touchedAt: string
}

/**
 * Module-scoped, so it is one store rather than one per component that asks.
 * Keyed by item id: he can have drafts on two items at once, and neither should
 * see the other's.
 */
const drafts = reactive<Record<number, ItemDraftEntry>>({})

/** Which ids have already been looked for in storage, so a miss is not re-read. */
const hydrated = new Set<number>()

const storageKey = (id: number) => `${KEY_PREFIX}${id}`

function readStored(id: number): ItemDraftEntry | null {
  try {
    const raw = sessionStorage.getItem(storageKey(id))
    if (!raw) return null
    const parsed = JSON.parse(raw) as ItemDraftEntry
    // A shape from an older build is not worth guessing at.
    if (!parsed?.fields || typeof parsed.override !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

function persist(id: number, entry: ItemDraftEntry) {
  try {
    sessionStorage.setItem(storageKey(id), JSON.stringify(entry))
  } catch {
    // Out of quota, or storage disabled. The draft still lives in memory.
  }
}

function forget(id: number) {
  try {
    sessionStorage.removeItem(storageKey(id))
  } catch {
    // Nothing to do — the in-memory delete below is what the screen reads.
  }
}

/**
 * The draft for an item, or null. Hydrates from session storage the first time
 * an id is asked for, so a reload mid-edit comes back to what he had typed.
 */
export function getDraft(id: number): ItemDraftEntry | null {
  if (!hydrated.has(id)) {
    hydrated.add(id)
    const stored = readStored(id)
    if (stored) drafts[id] = stored
  }
  return drafts[id] ?? null
}

/** Replace the draft wholesale. Cloned, so the caller's reactive object is not stored. */
export function setDraft(id: number, fields: ItemDraft, override: string) {
  hydrated.add(id)
  const entry: ItemDraftEntry = {
    fields: { ...fields, keywords: [...fields.keywords] },
    override,
    touchedAt: new Date().toISOString(),
  }
  drafts[id] = entry
  persist(id, entry)
}

/** Discard, and a successful Save. Either way there is no longer an unsaved edit. */
export function clearDraft(id: number) {
  delete drafts[id]
  forget(id)
}

/** For a screen that wants to know before it reads. */
export const hasDraft = (id: number) => getDraft(id) !== null
