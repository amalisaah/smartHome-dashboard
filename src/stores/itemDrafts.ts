import { reactive } from 'vue'
import type { ItemDraft } from '@/types/item'
import { isRecord, isString, isStringArray, sessionFamily } from '@/utils/storage'

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
 * Storage is reached through `@/utils/storage` rather than `sessionStorage`
 * directly: the guarding, the namespacing and the shape check all live there, so
 * this file is about what a draft *is* and not about what a private window does
 * to a getter.
 */

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

/**
 * The shape check. A draft written by an older build is dropped, not repaired:
 * it is half-typed work against a form whose fields may have changed, and a
 * guess at it would put values in front of him that he never typed.
 *
 * Only `fields` is checked structurally — the draft's own field list is
 * `ItemDraft`, and a missing optional there is indistinguishable from a blank
 * one, so what matters is that it is an object with the two keys the store
 * itself relies on.
 */
const isDraftEntry = (raw: unknown): ItemDraftEntry | null => {
  const record = isRecord(raw)
  if (!record) return null
  const fields = isRecord(record.fields)
  if (!fields) return null
  if (isString(record.override) === null) return null
  if (isString(record.touchedAt) === null) return null
  // `keywords` is the one field the screen iterates, so a bad one would throw
  // in the tag input rather than read as empty.
  if (isStringArray(fields.keywords) === null) return null
  return record as unknown as ItemDraftEntry
}

const stored = sessionFamily<ItemDraftEntry>('item-draft', isDraftEntry)

/**
 * The draft for an item, or null. Hydrates from session storage the first time
 * an id is asked for, so a reload mid-edit comes back to what he had typed.
 */
export function getDraft(id: number): ItemDraftEntry | null {
  if (!hydrated.has(id)) {
    hydrated.add(id)
    const found = stored.read(id)
    if (found) drafts[id] = found
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
  stored.write(id, entry)
}

/**
 * Discard, Cancel, and a successful Save. Every one of them means there is no
 * longer an unsaved edit, so every one of them comes through here — and it
 * clears memory and storage together, because a draft left in only one of them
 * is a draft that comes back on the next reload.
 */
export function clearDraft(id: number) {
  delete drafts[id]
  stored.clear(id)
}

/** For a screen that wants to know before it reads. */
export const hasDraft = (id: number) => getDraft(id) !== null

/**
 * Which items are carrying unsaved work. The app bar can ask this without
 * knowing how a draft key is spelled — it is the honest source for a global
 * "unsaved changes" line, which currently still reads `all changes saved`.
 */
export function draftedItemIds(): number[] {
  const fromMemory = Object.keys(drafts).map(Number)
  const fromStorage = stored.ids().map(Number).filter(Number.isInteger)
  return [...new Set([...fromMemory, ...fromStorage])]
}

/** Everything, on sign-out or a hard reset. */
export function clearAllDrafts() {
  for (const id of Object.keys(drafts).map(Number)) delete drafts[id]
  stored.clearAll()
}
