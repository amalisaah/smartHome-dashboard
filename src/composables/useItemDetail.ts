import { computed, reactive, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { OTHER_REASON } from '@/data/itemOptions'
import { clearDraft, getDraft, setDraft } from '@/stores/itemDrafts'
import {
  formatDelta,
  type ItemDetail,
  type ItemDraft,
  type Movement,
  type MovementKind,
  type PriceState,
} from '@/types/item'
import { formatMoney } from '@/utils/format'
import { toOverrideIntent } from '@/utils/mapper/itemMapper'

/**
 * The item screen's UI state: the draft, what in it differs from the record, the
 * price-override state, and the adjust-count draft.
 *
 * **Nothing saves until he says so.** What he types goes to `@/stores/itemDrafts`
 * and reaches the record only on Save — which is why the header says more than
 * the last save: with an explicit save there is a state between typed and stored.
 *
 * Adjusting the count is not part of this. It appends to the ledger with its own
 * reason, so it commits when the sheet is pressed.
 */

/** How long ago the record was last stored. */
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

/** What the header says, and whether it says it quietly. */
export interface SaveStatus {
  label: string
  tone: 'quiet' | 'risk'
}

/** The fields, in the order the left column asks for them. */
const FIELD_LABELS: Record<keyof ItemDraft, string> = {
  name: 'name',
  groupId: 'group',
  keywords: 'keywords',
  supplier: 'supplier',
  supplierLink: 'supplier link',
  supplierContact: 'supplier contact',
  leadDays: 'lead time',
  reorderLevel: 'reorder level',
  unit: 'unit',
  notes: 'notes',
  photoUrl: 'photo',
}

/** What the adjust-count sheet is being told to do. */
export type AdjustBasis = 'count' | 'delta'

export function useItemDetail(
  item: Ref<ItemDetail>,
  options?: {
    editable?: boolean
    /** The header says what the connection means for the work he has typed. */
    offline?: MaybeRefOrGetter<boolean>
    /**
     * The record does not exist yet. Everything else here is the same; there is
     * simply no last save to report, so the status counts what he has filled in.
     */
    creating?: boolean
  },
) {
  const offline = computed(() => toValue(options?.offline) === true)
  const creating = options?.creating === true

  // --- the edit gate -------------------------------------------------------

  /**
   * The laptop opens locked; the phone's Edit form passes `editable`. A draft
   * left in this session opens it too — landing on `2 unsaved changes` with only
   * an `Edit` button would show work at stake and withhold the press that saves it.
   */
  const editing = ref(options?.editable === true || getDraft(item.value.id) !== null)

  const startEditing = () => (editing.value = true)

  /**
   * Clears unconditionally, so one rule holds without exception: no edit mode,
   * no draft. The watcher below misses one case — a restored draft that happens
   * to *equal* the record is not dirty, so nothing fires and it would linger.
   */
  const stopEditing = () => {
    clearDraft(item.value.id)
    editing.value = false
  }

  /** The fields are inert unless he has said he is editing. */
  const locked = computed(() => !editing.value)

  // --- the fields he types -------------------------------------------------

  /** Seeded from the record, or from a draft left in this session. */
  const stored = getDraft(item.value.id)

  const draft = reactive<ItemDraft>(
    stored
      ? { ...stored.fields, keywords: [...stored.fields.keywords] }
      : { ...item.value.draft, keywords: [...item.value.draft.keywords] },
  )

  const group = computed(() => item.value.groups.find((it) => it.id === draft.groupId) ?? null)

  // --- the selling price ---------------------------------------------------
  // Before the change tracking, which counts the price as one of the things
  // that can differ from the record.

  const price = computed(() => item.value.derived.price)

  const state = ref<PriceState>(
    stored ? (stored.override === '' ? 'derived' : 'overridden') : price.value.state,
  )

  /** What the override input holds, as typed. */
  const overrideDraft = ref(
    stored
      ? stored.override
      : price.value.overridePesewas === null
        ? ''
        : formatMoney(price.value.overridePesewas),
  )

  /** Restored by Escape, which leaves the previous value without leaving the field. */
  let overrideBefore = overrideDraft.value

  /** The derived figure, formatted once — it is shown in both states. */
  const derivedPrice = computed(() => formatMoney(price.value.derivedPesewas))

  /** Prefilled with the derived figure: overriding starts from what it was. */
  function startOverride() {
    overrideDraft.value = derivedPrice.value
    overrideBefore = overrideDraft.value
    state.value = 'overridden'
  }

  /** No confirm: it is a change to the draft, and Discard undoes it wholesale. */
  function clearOverride() {
    state.value = 'derived'
    overrideDraft.value = ''
  }

  /** Escape restores the previous value without leaving the field. */
  function cancelOverrideEdit() {
    overrideDraft.value = overrideBefore
  }

  /** Settles what Escape would go back to. It saves nothing. */
  function commitOverride() {
    overrideBefore = overrideDraft.value
  }

  // --- what differs from the record ----------------------------------------

  const savedAt = ref(item.value.savedAt)

  /** So `Saved just now` becomes `Saved 1 minute ago` without a reload. */
  const now = ref(Date.now())
  const tick = () => (now.value = Date.now())

  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

  /**
   * Named as the labels above them, because the discard confirm shows them: a
   * confirm that says "4 changes" without saying which four asks him to remember.
   */
  const changedFields = computed(() => {
    const record = item.value.draft
    return (Object.keys(FIELD_LABELS) as (keyof ItemDraft)[])
      .filter((key) => !same(draft[key], record[key]))
      .map((key) => FIELD_LABELS[key])
  })

  /** The price counts as a change like any other field. */
  const priceChanged = computed(() => {
    const saved = price.value.overridePesewas
    const intent = toOverrideIntent(overrideDraft.value)
    if (state.value === 'derived') return saved !== null
    if (intent.kind === 'clear') return saved !== null
    if (intent.kind === 'invalid') return true
    return intent.pesewas !== saved
  })

  const changes = computed(() =>
    priceChanged.value ? [...changedFields.value, 'selling price'] : changedFields.value,
  )

  const dirty = computed(() => changes.value.length > 0)

  /**
   * Three things it can be about, only one of which is the last save: what is
   * stored, what is typed and not stored, and whether the network could take it.
   * Unsaved work reads in risk — the one state where doing nothing costs something.
   */
  const status = computed<SaveStatus>(() => {
    const n = changes.value.length
    const plural = n === 1 ? 'change' : 'changes'

    if (offline.value) {
      // The draft is still kept here, but there is no record to keep it against.
      if (creating) return { label: 'No connection — cannot create yet', tone: 'risk' }
      return {
        label: n > 0 ? `No connection — ${n} ${plural} kept on this device` : 'No connection',
        tone: 'risk',
      }
    }
    if (creating) {
      if (n === 0) return { label: 'Nothing entered yet', tone: 'quiet' }
      return { label: `Not created yet · ${n} ${n === 1 ? 'field' : 'fields'} filled`, tone: 'risk' }
    }
    if (n > 0) return { label: `${n} unsaved ${plural}`, tone: 'risk' }
    return { label: relativeSave(savedAt.value, now.value), tone: 'quiet' }
  })

  // --- the store ------------------------------------------------------------

  /** Every keystroke goes to the store, not to the API. Deep, for `keywords`. */
  watch(
    [draft, overrideDraft, state],
    () => {
      if (!dirty.value) {
        clearDraft(item.value.id)
        return
      }
      setDraft(item.value.id, draft, state.value === 'derived' ? '' : overrideDraft.value)
    },
    { deep: true },
  )

  /** Back to the record, and drop the draft with it. */
  function reset() {
    const record = item.value.draft
    Object.assign(draft, { ...record, keywords: [...record.keywords] })
    state.value = price.value.state
    overrideDraft.value =
      price.value.overridePesewas === null ? '' : formatMoney(price.value.overridePesewas)
    overrideBefore = overrideDraft.value
    clearDraft(item.value.id)
  }

  /** Throw the typed work away and leave edit mode. */
  function discard() {
    reset()
    editing.value = false
  }

  /** The caller does the writing; this says there is no longer an unsaved edit. */
  function markSaved() {
    savedAt.value = new Date().toISOString()
    now.value = Date.now()
    clearDraft(item.value.id)
    editing.value = false
  }

  // --- adjust count --------------------------------------------------------

  const adjustOpen = ref(false)
  const basis = ref<AdjustBasis>('delta')
  const countDraft = ref('')
  const deltaDraft = ref('')
  const reason = ref('')
  const freeReason = ref('')
  /** Nothing is red until he has tried to record. */
  const pressed = ref(false)

  const stockNow = computed(() => item.value.derived.stockCount)

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

  /** Stated as what it stops, as every other validation here is. */
  const reasonError = computed(() =>
    reasonText.value ? '' : 'A movement needs a reason — it is what the history is for.',
  )

  /** Signed, or null while unusable. */
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
   * Read back in the Movements-row format — the shape he will later read it in.
   * Split at the delta because a delta carries its own ink in a row.
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

  /** It writes a movement, never a total — hence no stock field on this screen. */
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

    // Nothing here saves: `markSaved` is what the caller calls once it lands.
    changes,
    dirty,
    status,
    tick,
    discard,
    reset,
    markSaved,

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
