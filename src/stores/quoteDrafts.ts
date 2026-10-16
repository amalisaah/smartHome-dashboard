import { reactive } from 'vue'
import { emptyDraft, type AddedLine, type LineEdit, type QuoteDraft } from '@/types/quote'
import { isRecord, isString, sessionFamily } from '@/utils/storage'

/**
 * Unsaved quote edits, held for the tab's lifetime.
 *
 * The quote screen writes **nothing** while he is editing. What he changes goes
 * here, and the API is touched once, when he submits. That is the whole point:
 * the previous shape wrote on every tap and re-read the quote twice afterwards,
 * which on a phone in a customer's living room meant the radio never settled.
 *
 * **Session, not local.** A half-finished edit is worth surviving a reload — he
 * is standing in a hallway and the browser may drop the tab. It is not worth
 * surviving until the prices it was typed against have moved.
 *
 * A draft is a **diff**, not a copy. See `QuoteDraft`: holding the whole quote
 * would mean submitting fields he never touched over figures that may have
 * changed under him.
 */

/** Module-scoped and keyed by quote id: two quotes can be drafted at once. */
const drafts = reactive<Record<number, QuoteDraft>>({})

/** Which ids have been looked for in storage, so a miss is not re-read. */
const hydrated = new Set<number>()

/**
 * A draft from an older build is dropped, not repaired. A guess at a stale
 * shape would put quantities in front of him he never typed — and then submit
 * them.
 */
const isAddedLine = (raw: unknown): AddedLine | null => {
  const record = isRecord(raw)
  if (!record) return null
  const { tempId, itemId, roomId, quantity, need, note } = record
  if (typeof tempId !== 'number' || typeof itemId !== 'number') return null
  if (typeof quantity !== 'number' || !Number.isFinite(quantity)) return null
  if (roomId !== null && typeof roomId !== 'number') return null
  if (typeof need !== 'string') return null
  if (note !== null && typeof note !== 'string') return null
  return { tempId, itemId, roomId, quantity, need, note }
}

/**
 * One line's edit. Checked field by field rather than cast, because these
 * numbers go straight into the money sums and then into a `PATCH`: a string
 * `quantity` from a stale draft would multiply into a price and be written back
 * to the record.
 */
const isLineEdit = (raw: unknown): LineEdit | null => {
  const record = isRecord(raw)
  if (!record) return null
  const edit: LineEdit = {}
  if (record.quantity !== undefined) {
    if (typeof record.quantity !== 'number' || !Number.isFinite(record.quantity)) return null
    edit.quantity = record.quantity
  }
  if (record.need !== undefined) {
    if (typeof record.need !== 'string') return null
    edit.need = record.need
  }
  if (record.note !== undefined) {
    if (record.note !== null && typeof record.note !== 'string') return null
    edit.note = record.note
  }
  if (record.removed !== undefined) {
    if (typeof record.removed !== 'boolean') return null
    edit.removed = record.removed
  }
  return edit
}

const isDraft = (raw: unknown): QuoteDraft | null => {
  const record = isRecord(raw)
  if (!record) return null
  if (isString(record.touchedAt) === null) return null

  const rawLines = isRecord(record.lines)
  if (!rawLines) return null
  const lines: QuoteDraft['lines'] = {}
  for (const [key, value] of Object.entries(rawLines)) {
    if (!Number.isFinite(Number(key))) return null
    const edit = isLineEdit(value)
    if (!edit) return null
    lines[key] = edit
  }

  if (!Array.isArray(record.added)) return null
  const added: AddedLine[] = []
  for (const row of record.added) {
    const line = isAddedLine(row)
    if (!line) return null
    added.push(line)
  }

  const charges = record.charges
  if (charges !== null) {
    const shape = isRecord(charges)
    if (!shape) return null
    if (typeof shape.labour !== 'string') return null
    if (typeof shape.materials !== 'string') return null
    if (typeof shape.misc !== 'string') return null
  }

  return {
    lines,
    added,
    charges: charges as QuoteDraft['charges'],
    touchedAt: record.touchedAt as string,
  }
}

const stored = sessionFamily<QuoteDraft>('quote-draft', isDraft)

/** The draft for one quote, read from storage the first time it is asked for. */
export function getDraft(quoteId: number): QuoteDraft {
  if (!hydrated.has(quoteId)) {
    hydrated.add(quoteId)
    const found = stored.read(quoteId)
    if (found) drafts[quoteId] = found
  }
  return drafts[quoteId] ?? emptyDraft()
}

/** Whether a quote has unsubmitted work, without hydrating a second time. */
export const hasDraft = (quoteId: number) => {
  const draft = getDraft(quoteId)
  return (
    Object.keys(draft.lines).length > 0 || draft.added.length > 0 || draft.charges !== null
  )
}

export function setDraft(quoteId: number, draft: QuoteDraft) {
  const stamped = { ...draft, touchedAt: new Date().toISOString() }
  hydrated.add(quoteId)
  drafts[quoteId] = stamped
  stored.write(quoteId, stamped)
}

/** Reset, and what submitting clears on the way out. */
export function clearDraft(quoteId: number) {
  hydrated.add(quoteId)
  delete drafts[quoteId]
  stored.clear(quoteId)
}
