import { reactive } from 'vue'
import { NEW_ITEM_ID, type ItemDraft } from '@/types/item'
import { isRecord, isString, isStringArray, sessionFamily } from '@/utils/storage'

/**
 * Unsaved item edits, held for the tab's lifetime.
 *
 * The item screen has no save-on-blur: what he types goes here, and nothing
 * reaches the API until he presses Save. It is shared because two screens can be
 * looking at the same item — the laptop's columns and the phone's Edit route —
 * and a draft on only one of them would be lost by navigating between them.
 *
 * **Session, not local.** A half-finished edit is worth surviving a reload; it is
 * not worth surviving until the figures it was typed against have moved.
 *
 * The item being created is held here too, under `NEW_ITEM_ID` — it is the same
 * form holding the same fields, and the only thing it lacks is an id of its own.
 */

/** Every field he types, and the price he decided. */
export interface ItemDraftEntry {
  fields: ItemDraft
  /** As typed, so a half-typed figure survives a reload. Empty = group default. */
  override: string
  touchedAt: string
}

/** Module-scoped, and keyed by item id: two items can be drafted at once. */
const drafts = reactive<Record<number, ItemDraftEntry>>({})

/** Which ids have already been looked for in storage, so a miss is not re-read. */
const hydrated = new Set<number>()

/**
 * A draft from an older build is dropped, not repaired: a guess at a stale shape
 * would put values in front of him he never typed.
 */
const isDraftEntry = (raw: unknown): ItemDraftEntry | null => {
  const record = isRecord(raw)
  if (!record) return null
  const fields = isRecord(record.fields)
  if (!fields) return null
  if (isString(record.override) === null) return null
  if (isString(record.touchedAt) === null) return null
  // The one field the screen iterates, so a bad one throws rather than reads empty.
  if (isStringArray(fields.keywords) === null) return null
  return record as unknown as ItemDraftEntry
}

const stored = sessionFamily<ItemDraftEntry>('item-draft', isDraftEntry)

/** Hydrates from storage the first time an id is asked for. */
export function getDraft(id: number): ItemDraftEntry | null {
  if (!hydrated.has(id)) {
    hydrated.add(id)
    const found = stored.read(id)
    if (found) drafts[id] = found
  }
  return drafts[id] ?? null
}

/** Cloned, so the caller's reactive object is not what gets stored. */
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
 * Discard, Cancel and a successful Save all mean the same thing, so all three
 * come here. Memory and storage go together: a draft left in one comes back.
 */
export function clearDraft(id: number) {
  delete drafts[id]
  stored.clear(id)
}

/** For a screen that wants to know before it reads. */
export const hasDraft = (id: number) => getDraft(id) !== null

/**
 * The honest source for a global "unsaved changes" line. The item being created
 * is left out: `NEW_ITEM_ID` leads to no item, and a caller that turns these into
 * links would offer one to a record that does not exist.
 */
export function draftedItemIds(): number[] {
  const fromMemory = Object.keys(drafts).map(Number)
  const fromStorage = stored.ids().map(Number).filter(Number.isInteger)
  return [...new Set([...fromMemory, ...fromStorage])].filter((id) => id !== NEW_ITEM_ID)
}

/** Everything, on sign-out or a hard reset. */
export function clearAllDrafts() {
  for (const id of Object.keys(drafts).map(Number)) delete drafts[id]
  stored.clearAll()
}
