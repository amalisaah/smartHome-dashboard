import { computed, reactive, ref, type Ref } from 'vue'
import { OTHER_REASON } from '@/data/itemDetailMock'
import {
  formatDelta,
  type ItemDetail,
  type ItemDraft,
  type Movement,
  type MovementKind,
  type PriceState,
} from '@/types/item'
import { formatMoney } from '@/utils/format'

/**
 * The UI state the item-detail screen holds, and nothing else: per-field drafts,
 * when it last saved, whether the price is being overridden, and the
 * adjust-count draft.
 *
 * There is no save action here because there is no Save button — a field saves
 * when it is left, and the header timestamp is the confirmation. What "saves"
 * means beyond stamping the clock is the endpoint's business, not this screen's.
 */

/** How long ago, in his words. The one string the header timestamp reads. */
export function relativeSave(iso: string, now: number): string {
  const seconds = Math.round((now - Date.parse(iso)) / 1000)
  if (seconds < 45) return 'Saved just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `Saved ${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Saved ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `Saved ${days} day${days === 1 ? '' : 's'} ago`
}

/** What the adjust-count sheet is being told to do. */
export type AdjustBasis = 'count' | 'delta'

export function useItemDetail(item: Ref<ItemDetail>, options?: { editable?: boolean }) {
  // --- the edit gate -------------------------------------------------------

  /**
   * On the laptop the record opens locked and `Edit` unlocks it. The phone's
   * Edit form is already the answer to "I want to change this", so it passes
   * `editable` and has no gate of its own.
   *
   * Leaving edit mode is not a save — every field has already saved on its own
   * blur. It only puts the record back to being read.
   */
  const editing = ref(options?.editable === true)

  const startEditing = () => (editing.value = true)
  const stopEditing = () => (editing.value = false)

  /** The fields are inert unless he has said he is editing. */
  const locked = computed(() => !editing.value)

  // --- the fields he types -------------------------------------------------

  /**
   * The draft is the screen's copy, not the record's. It is what the fields are
   * bound to, so a field holds what he typed even while the record behind it is
   * revalidating.
   */
  const draft = reactive<ItemDraft>({ ...item.value.draft, keywords: [...item.value.draft.keywords] })

  const group = computed(() =>
    item.value.groups.find((it) => it.id === draft.groupId) ?? null,
  )

  // --- saving --------------------------------------------------------------

  const savedAt = ref(item.value.savedAt)

  /**
   * A clock the header re-reads, so `Saved just now` becomes `Saved 1 minute
   * ago` without a reload. Ticked by the view, which owns the interval.
   */
  const now = ref(Date.now())
  const tick = () => (now.value = Date.now())

  const savedLabel = computed(() => relativeSave(savedAt.value, now.value))

  /**
   * The last shape that was saved. A blur only stamps the clock when something
   * actually changed — leaving a field he only looked at is not a save, and a
   * timestamp that moves when nothing did stops meaning anything.
   */
  let lastSaved = snapshot(draft)

  function snapshot(values: ItemDraft) {
    return JSON.stringify({ ...values, keywords: [...values.keywords] })
  }

  /**
   * A field was left. `focusout` rather than `blur` because blur does not
   * bubble, and the fields are atoms: the column hears it, not each control.
   */
  function saveOnBlur() {
    const current = snapshot(draft)
    if (current === lastSaved) return
    lastSaved = current
    savedAt.value = new Date().toISOString()
    now.value = Date.now()
  }

  // --- the selling price ---------------------------------------------------

  const price = computed(() => item.value.derived.price)

  const state = ref<PriceState>(price.value.state)

  /** What the override input holds, as typed. */
  const overrideDraft = ref(
    price.value.overridePesewas === null ? '' : formatMoney(price.value.overridePesewas),
  )

  /** Restored by Escape, which leaves the previous value without leaving the field. */
  let overrideBefore = overrideDraft.value

  /** The derived figure, formatted once — it is shown in both states. */
  const derivedPrice = computed(() => formatMoney(price.value.derivedPesewas))

  /**
   * Pressing `Override` hands him the derived figure to edit rather than an
   * empty box: overriding starts from what the system decided, so the first
   * keystroke is a change to a real number and not the whole number retyped.
   */
  function startOverride() {
    overrideDraft.value = derivedPrice.value
    overrideBefore = overrideDraft.value
    state.value = 'overridden'
  }

  /** Back to the group default. No confirm — the figure it returns to is on screen. */
  function clearOverride() {
    state.value = 'derived'
    overrideDraft.value = ''
    saveOnBlur()
  }

  /** Escape while editing an override restores the previous value, in place. */
  function cancelOverrideEdit() {
    overrideDraft.value = overrideBefore
  }

  function commitOverride() {
    overrideBefore = overrideDraft.value
    saveOnBlur()
  }

  // --- adjust count --------------------------------------------------------

  const adjustOpen = ref(false)
  const basis = ref<AdjustBasis>('delta')
  const countDraft = ref('')
  const deltaDraft = ref('')
  const reason = ref('')
  const freeReason = ref('')
  /** Nothing is red until he has tried to record. A blank form is not an error. */
  const pressed = ref(false)

  const stockNow = computed(() => {
    const movements = item.value.derived.movements
    return movements.length > 0 ? movements[movements.length - 1].balance : 0
  })

  function openAdjust() {
    basis.value = 'delta'
    countDraft.value = String(stockNow.value)
    deltaDraft.value = ''
    reason.value = ''
    freeReason.value = ''
    pressed.value = false
    adjustOpen.value = true
  }

  const closeAdjust = () => (adjustOpen.value = false)

  /** The reason that will be written, whichever way he gave it. */
  const reasonText = computed(() =>
    reason.value === OTHER_REASON ? freeReason.value.trim() : reason.value,
  )

  /** Stated as what it stops, the way every other validation on this app is. */
  const reasonError = computed(() =>
    reasonText.value ? '' : 'A movement needs a reason — it is what the history is for.',
  )

  /** The change to stock, signed, as a number — or null while it is unusable. */
  const resolvedDelta = computed<number | null>(() => {
    const raw = basis.value === 'delta' ? deltaDraft.value : countDraft.value
    const text = raw.trim()
    if (text === '' || !/^[-+]?\d+$/.test(text)) return null
    const value = Number(text)
    return basis.value === 'delta' ? value : value - stockNow.value
  })

  const amountError = computed(() => {
    if (resolvedDelta.value === null) {
      return basis.value === 'delta'
        ? 'Give the change as a number — `-2`, or `+5`.'
        : 'Give the count as a whole number.'
    }
    if (resolvedDelta.value === 0) return 'That is the count already — nothing to record.'
    return ''
  })

  const canRecord = computed(() => !reasonError.value && !amountError.value)

  /**
   * The movement this will write, in the Movements-row format, so what he is
   * about to do is read back to him in the shape he will later read it. Split at
   * the delta because the delta carries its own ink in a row, and has to here.
   */
  const consequence = computed(() => {
    if (resolvedDelta.value === null || resolvedDelta.value === 0) return null
    const delta = resolvedDelta.value
    const balance = stockNow.value + delta
    return {
      delta: formatDelta(delta),
      kind: (delta > 0 ? 'in' : 'out') satisfies MovementKind as MovementKind,
      text: `· ${reasonText.value || 'a reason'} · balance ${balance}`,
    }
  })

  /**
   * What the sheet hands back. It writes a movement; it never edits a total —
   * which is why there is no stock field anywhere on this screen.
   */
  function recordMovement(): Omit<Movement, 'id' | 'date'> | null {
    pressed.value = true
    if (!canRecord.value || resolvedDelta.value === null) return null
    const delta = resolvedDelta.value
    return {
      description: reasonText.value,
      shortDescription: reasonText.value,
      delta,
      balance: stockNow.value + delta,
      kind: delta > 0 ? 'in' : 'out',
    }
  }

  // --- archive -------------------------------------------------------------

  const archiveOpen = ref(false)

  return {
    editing,
    locked,
    startEditing,
    stopEditing,

    draft,
    group,
    savedLabel,
    tick,
    saveOnBlur,

    state,
    derivedPrice,
    overrideDraft,
    startOverride,
    clearOverride,
    cancelOverrideEdit,
    commitOverride,

    adjustOpen,
    basis,
    countDraft,
    deltaDraft,
    reason,
    freeReason,
    pressed,
    stockNow,
    reasonError,
    amountError,
    canRecord,
    consequence,
    openAdjust,
    closeAdjust,
    recordMovement,

    archiveOpen,
  }
}
