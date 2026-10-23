import { computed, ref, watch, type Ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { addQuoteLines, updateQuoteCharges, updateQuoteLines } from '@/api/quotes'
import { quoteKeys } from '@/api/hooks/quotes'
import { clearDraft, getDraft, setDraft } from '@/stores/quoteDrafts'
import { useSaveReporter } from '@/composables/useSaveState'
import {
  draftChangeCount,
  draftIsEmpty,
  emptyDraft,
  fromPesewas,
  needGroups,
  quoteIsLocked,
  roomIdToApi,
  roomSummaries,
  toPesewas,
  WHOLE_HOUSE,
  type AddedLine,
  type ChargesDraft,
  type LineEdit,
  type QuoteDraft,
  type QuoteLine,
  type QuoteMode,
  type QuoteMoney,
  type QuoteOwnerView,
  type QuoteRoom,
} from '@/types/quote'
import type { CatalogueItem } from '@/types/catalogue'

/**
 * The quote builder's draft. The view owns the queries; this owns what he is
 * doing to them.
 *
 * **Reading first, and nothing is written until he says so.** The screen opens
 * inert. `Edit quote` makes it live, every change goes into a local diff that
 * survives a reload, and the API is touched exactly once — when he submits.
 *
 * That shape is deliberate and it replaced a worse one. Writing per edit cost
 * three round trips a tap (a `PATCH`, then two `GET`s to re-read the totals),
 * so twenty edits in a living room came to sixty requests. Each small request
 * wakes the phone's radio and holds it awake for seconds afterwards, so the
 * cost was mostly battery spent on nothing. Submitting sends one bulk add per
 * room, one bulk patch for every changed line, and one charges write — and the
 * last of those answers with the new totals, so there is nothing to re-read.
 *
 * While he edits, the money is worked out here from figures the server already
 * supplied — each line's unit selling price and unit landed cost — because the
 * server cannot be asked without the round trips this exists to avoid. That is
 * multiplication and addition over given numbers, not pricing: the moment he
 * submits, the server's own figures replace them.
 */

export type Audience = 'owner' | 'customer'
export type GroupBy = 'room' | 'need'

interface Options {
  quoteId: Ref<number>
  /** The server's answer, or null while the first read is in flight. */
  ownerView: Ref<QuoteOwnerView | null>
  rooms: Ref<QuoteRoom[]>
  /** The whole catalogue, fetched once and searched in memory. */
  catalogue: Ref<CatalogueItem[]>
  online: Ref<boolean>
}

export function useQuoteBuilder({ quoteId, ownerView, rooms, catalogue, online }: Options) {
  const queryClient = useQueryClient()
  const save = useSaveReporter()

  // --- mode and draft -------------------------------------------------------

  const mode = ref<QuoteMode>('reading')
  const draft = ref<QuoteDraft>(emptyDraft())
  const submitting = ref(false)
  const submitError = ref<string | null>(null)



  /**
   * The next stand-in id for a line the server has not numbered yet.
   *
   * Monotonic, and seeded below whatever a restored draft already uses. It was
   * briefly derived from the clock and the draft's length, which collided:
   * `-(0+1) - 500` and `-(1+1) - 499` are both `-501`, and two lines sharing an
   * id means one stepper moving both of them.
   */
  let nextTempId = -1

  const seedTempId = (lines: AddedLine[]) => {
    for (const line of lines) nextTempId = Math.min(nextTempId, line.tempId - 1)
  }

  /** Every change goes through here, so nothing can edit without persisting. */
  function change(mutate: (next: QuoteDraft) => void) {
    const next: QuoteDraft = {
      lines: { ...draft.value.lines },
      added: [...draft.value.added],
      charges: draft.value.charges ? { ...draft.value.charges } : null,
      touchedAt: draft.value.touchedAt,
    }
    mutate(next)
    draft.value = next
    setDraft(quoteId.value, next)
  }

  const dirty = computed(() => !draftIsEmpty(draft.value))
  const changeCount = computed(() => draftChangeCount(draft.value))

  /**
   * A quote that has been sent is a **record**, not a document being written.
   *
   * It opens exactly as a draft does — the same rooms, the same lines, the same
   * money — because what he came for is the same thing: the numbers. What is
   * gone is every way to change them. A sent quote's prices are frozen and she
   * has been given them; an answered one is what she answered.
   *
   * It is read off the quote the server sent rather than off the list row that
   * led here, so an address typed straight in is locked too, and a quote sent
   * from another device locks the moment this one reads it.
   */
  const locked = computed(() => {
    const status = ownerView.value?.header.status
    return status !== undefined && quoteIsLocked(status)
  })

  /**
   * Live only while he is editing *and* nothing is being sent. Rows stay put
   * during a submit: the draft is being consumed piece by piece as each request
   * lands, and an edit landing in the middle of that would be dropped with the
   * piece it arrived in.
   *
   * A locked quote is never live, whatever mode it was left in. The gate is here
   * rather than on each control, so a control added later cannot miss it.
   */
  const editable = computed(
    () => mode.value === 'editing' && !submitting.value && !locked.value,
  )

  function startEditing() {
    if (locked.value) return
    mode.value = 'editing'
  }

  /** Reset. Everything unsubmitted goes, and the screen is the server's again. */
  function reset() {
    clearDraft(quoteId.value)
    draft.value = emptyDraft()
    submitError.value = null
    mode.value = 'reading'
    expandedLineId.value = null
  }

  // --- screen state ---------------------------------------------------------

  /**
   * The room he has picked, if he has picked one. `activeRoomId` below falls
   * back to a sensible first room, so this stays null until he chooses.
   */
  const chosenRoomId = ref<number | null>(null)
  const groupBy = ref<GroupBy>('room')
  const expandedLineId = ref<number | null>(null)
  const showOff = ref(false)
  const pickerOpen = ref(false)
  const moneyOpen = ref(false)
  /**
   * The answer sheet — block B.
   *
   * It is opened by `Record her answer` and by nothing else. The handoff has it
   * open itself on every sent quote, on the grounds that recording her answer is
   * the only reason to open one; but he also opens a sent quote to read a number
   * out loud to her on the phone, and a sheet covering the lines he is reading
   * from is a sheet he dismisses before he can do the thing he came for.
   */
  const answerOpen = ref(false)
  const itemised = ref(false)
  const addedCount = ref(0)
  const toast = ref('')

  /**
   * One audience state, not two. The README's "the laptop doesn't switch the
   * phone" is about two machines in the room, each with its own session — not
   * about one browser crossing the breakpoint, where it is the same person
   * holding the same screen and a mode that reset itself on resize would be a
   * cost leak waiting to happen.
   */
  const audience = ref<Audience>('owner')

  /**
   * Opening a quote: pick its stored draft back up, and put everything else
   * back to how a quote opens.
   *
   * **All of it, not just the draft.** The router reuses this component between
   * quotes, so without the reset below quote 8 would open in edit mode because
   * quote 7 was being edited, on a room id belonging to quote 7's house — which
   * shows an empty table — and, worst of all, in whichever audience quote 7 was
   * left in. Unsubmitted work is the one thing that carries over, and only for
   * the quote it belongs to.
   */
  watch(
    quoteId,
    (id) => {
      const found = getDraft(id)
      draft.value = found
      seedTempId(found.added)

      chosenRoomId.value = null
      expandedLineId.value = null
      showOff.value = false
      pickerOpen.value = false
      moneyOpen.value = false
      answerOpen.value = false
      submitError.value = null
      audience.value = 'owner'
      mode.value = draftIsEmpty(found) ? 'reading' : 'editing'
    },
    { immediate: true },
  )

  /**
   * Which room the centre is showing: his choice, or the first room that has
   * anything in it, or simply the first room of the house.
   *
   * **Derived, not watched.** This used to be a `ref` seeded by a watcher on the
   * server's answer, which worked only when that answer arrived *after* the
   * screen did. Coming back to a quote whose read was already cached, the
   * watcher never fired and the screen sat on no room at all — an empty table
   * under a heading that said "the quote", which a reload appeared to fix
   * because it emptied the cache. Reading it as a computed cannot race: there
   * is no moment when the data is present and the choice is not.
   */
  const activeRoomId = computed<number | null>(() => {
    if (chosenRoomId.value !== null) return chosenRoomId.value
    const firstWithLines = (ownerView.value?.lines ?? []).find(
      (line) => !line.isRemoved && line.roomId !== null,
    )?.roomId
    return firstWithLines ?? rooms.value[0]?.id ?? null
  })

  // --- the catalogue --------------------------------------------------------

  const catalogueById = computed(() => {
    const map = new Map<number, CatalogueItem>()
    for (const item of catalogue.value) map.set(item.id, item)
    return map
  })

  /**
   * The need the catalogue would give this item. The chips draw it dashed
   * wherever it sits — including when he has picked something else, because the
   * dash is what says "this is the one you were offered".
   */
  const defaultNeedFor = (itemId: number) => catalogueById.value.get(itemId)?.group?.slug ?? null

  /**
   * The picker's results. Name and group, as the handoff says, which is why the
   * catalogue is held in memory rather than searched over the wire — `?q=`
   * matches name and keywords only, and a request per keystroke is exactly the
   * traffic this screen is built to avoid.
   */
  function search(query: string): CatalogueItem[] {
    const needle = query.trim().toLowerCase()
    if (!needle) return catalogue.value
    return catalogue.value.filter((item) =>
      `${item.name ?? ''} ${item.group?.name ?? ''} ${item.keywords.join(' ')}`
        .toLowerCase()
        .includes(needle),
    )
  }

  // --- the lines, as the screen sees them -----------------------------------

  /** A line he added, given the shape every row renders. */
  function materialise(added: AddedLine): QuoteLine {
    const item = catalogueById.value.get(added.itemId)
    const unit = item?.sellPricePesewas ?? 0
    const cost = item?.landedCostPesewas ?? 0
    return {
      id: added.tempId,
      roomId: added.roomId,
      roomName:
        added.roomId === null
          ? 'Whole house'
          : (rooms.value.find((room) => room.id === added.roomId)?.name ?? null),
      itemId: added.itemId,
      itemName: item?.name ?? null,
      need: added.need,
      quantity: added.quantity,
      unitPricePesewas: unit,
      unitCostPesewas: cost,
      totalPesewas: unit * added.quantity,
      costPesewas: cost * added.quantity,
      note: added.note,
      isRemoved: false,
      removedAt: null,
      sortOrder: Number.MAX_SAFE_INTEGER,
      // Stock is the server's to judge. A line it has never seen says nothing
      // about stock rather than guessing from a catalogue count.
      stock: null,
    }
  }

  /** The server's lines with his unsubmitted changes laid over them. */
  const lines = computed<QuoteLine[]>(() => {
    const server = ownerView.value?.lines ?? []
    const edits = draft.value.lines

    const overlaid = server.map((line) => {
      const edit = edits[String(line.id)]
      if (!edit) return line
      const quantity = edit.quantity ?? line.quantity
      return {
        ...line,
        quantity,
        need: edit.need ?? line.need,
        note: edit.note !== undefined ? edit.note : line.note,
        isRemoved: edit.removed ?? line.isRemoved,
        totalPesewas: line.unitPricePesewas * quantity,
        costPesewas: line.unitCostPesewas * quantity,
      }
    })

    return [...overlaid, ...draft.value.added.map(materialise)]
  })

  // --- money ----------------------------------------------------------------

  const charges = computed<ChargesDraft>(() => {
    if (draft.value.charges) return draft.value.charges
    const current = ownerView.value?.money
    if (!current) return { labour: '', materials: '', misc: '' }
    // A charge the server is deriving leaves its box empty, so the derived
    // figure shows as placeholder and the border stays dashed: what is in the
    // box is what he set, and nothing else.
    return {
      labour: current.labourIsDerived ? '' : fromPesewas(current.labourPesewas),
      materials: current.materialsIsDerived ? '' : fromPesewas(current.materialsPesewas),
      misc: current.miscPesewas ? fromPesewas(current.miscPesewas) : '',
    }
  })

  /**
   * What the money boxes show.
   *
   * With nothing unsubmitted this is the server's answer verbatim — every
   * figure supplied, nothing worked out here. With a draft open the server does
   * not know about the change yet, and asking it would cost the round trips this
   * screen exists to avoid, so the figures that follow from the lines are summed
   * from the per-unit prices the server already gave. The two a draft cannot
   * reach are a *derived* labour or materials charge, which depend on the room
   * count and a rate this screen has never been told; those keep the server's
   * last value and settle on submit.
   */
  const money = computed<QuoteMoney | null>(() => {
    const base = ownerView.value?.money
    if (!base) return null
    if (!dirty.value) return base

    const live = lines.value.filter((line) => !line.isRemoved)
    const devicePesewas = live.reduce((sum, line) => sum + line.totalPesewas, 0)
    const deviceCostPesewas = live.reduce((sum, line) => sum + line.costPesewas, 0)

    const typedLabour = toPesewas(charges.value.labour)
    const typedMaterials = toPesewas(charges.value.materials)
    const miscPesewas = toPesewas(charges.value.misc) ?? 0

    const labourIsDerived = typedLabour === null
    const materialsIsDerived = typedMaterials === null
    const labourPesewas = typedLabour ?? base.labourPesewas
    const materialsPesewas = typedMaterials ?? base.materialsPesewas

    const proposedPesewas = devicePesewas + labourPesewas + materialsPesewas
    const costPesewas = deviceCostPesewas + miscPesewas

    return {
      devicePesewas,
      labourPesewas,
      labourIsDerived,
      materialsPesewas,
      materialsIsDerived,
      roomCount: base.roomCount,
      proposedPesewas,
      miscPesewas,
      deviceCostPesewas,
      costPesewas,
      profitPesewas: proposedPesewas - costPesewas,
    }
  })

  function setCharge(field: keyof ChargesDraft, value: string) {
    const current = charges.value
    change((next) => {
      next.charges = { ...current, [field]: value }
    })
  }

  // --- editing --------------------------------------------------------------

  let toastTimer: ReturnType<typeof setTimeout> | null = null

  function showToast(text: string) {
    toast.value = text
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = ''), 1800)
  }

  /**
   * The edit recorded against one server line, merged with what is there.
   *
   * A field put back to what the server already holds stops being an edit, and
   * a line with nothing left to say drops out of the draft entirely. Without
   * that, switching a line off and straight back on would submit an
   * `is_removed: false` for a line that was never removed, and would count as a
   * change on a quote that is unchanged.
   */
  function edit(lineId: number, fields: LineEdit) {
    const server = (ownerView.value?.lines ?? []).find((line) => line.id === lineId)
    change((next) => {
      const key = String(lineId)
      const merged: LineEdit = { ...(next.lines[key] ?? {}), ...fields }

      if (server) {
        if (merged.quantity === server.quantity) delete merged.quantity
        if (merged.need === server.need) delete merged.need
        if (merged.note !== undefined && (merged.note ?? null) === (server.note ?? null)) {
          delete merged.note
        }
        if (merged.removed === server.isRemoved) delete merged.removed
      }

      if (Object.keys(merged).length === 0) delete next.lines[key]
      else next.lines[key] = merged
    })
  }

  /** The same, for a line that exists only in the draft. */
  function editAdded(tempId: number, fields: Partial<AddedLine>) {
    change((next) => {
      next.added = next.added.map((line) =>
        line.tempId === tempId ? { ...line, ...fields } : line,
      )
    })
  }

  const isAdded = (lineId: number) => lineId < 0

  /**
   * Add to the **active room**. Tapping an item already in that room adds one
   * to its line rather than starting a second — the API has no merge, and two
   * lines for one product is not what he meant.
   */
  function add(item: CatalogueItem) {
    const roomId = roomIdToApi(activeRoomId.value)
    const existing = lines.value.find(
      (line) => !line.isRemoved && line.roomId === roomId && line.itemId === item.id,
    )

    if (existing) {
      step(existing.id, +1)
    } else {
      const tempId = nextTempId--
      change((next) => {
        next.added = [
          ...next.added,
          {
            tempId,
            itemId: item.id,
            roomId,
            quantity: 1,
            need: item.group?.slug ?? 'control',
            note: null,
          },
        ]
      })
    }

    addedCount.value += 1
    const room = rooms.value.find((r) => r.id === roomId)
    showToast(`${item.name ?? 'Item'} → ${room?.name ?? 'the quote'}`)
  }

  /** The stepper. One is the minimum: taking a line out is switching it off. */
  function step(lineId: number, by: 1 | -1) {
    const line = lines.value.find((candidate) => candidate.id === lineId)
    if (!line) return
    const quantity = Math.max(1, line.quantity + by)
    if (quantity === line.quantity) return

    if (isAdded(lineId)) editAdded(lineId, { quantity })
    else edit(lineId, { quantity })
  }

  function setNeed(lineId: number, need: string) {
    if (isAdded(lineId)) editAdded(lineId, { need })
    else edit(lineId, { need })
  }

  function setNote(lineId: number, note: string) {
    const value = note.trim() ? note : null
    if (isAdded(lineId)) editAdded(lineId, { note: value })
    else edit(lineId, { note: value })
  }

  /**
   * Switched off, never deleted: out of every total and out of her view.
   *
   * A line that only exists in the draft has nothing to switch off — it is
   * dropped, because there is no record of it to keep.
   */
  function switchOff(lineId: number) {
    if (expandedLineId.value === lineId) expandedLineId.value = null
    if (isAdded(lineId)) {
      change((next) => {
        next.added = next.added.filter((line) => line.tempId !== lineId)
      })
      return
    }
    edit(lineId, { removed: true })
  }

  function switchOn(lineId: number) {
    edit(lineId, { removed: false })
  }

  // --- submitting -----------------------------------------------------------

  /**
   * Everything he changed, in as few requests as the API allows: one bulk add
   * per room, one bulk patch for every line he altered or switched, and one
   * write for the money.
   *
   * The last two answer with the quote and its new totals, so the server's own
   * figures go straight into the cache and a submit that touched a line or the
   * money needs no re-read at all.
   */
  async function submit(): Promise<boolean> {
    if (!dirty.value || submitting.value) return true

    submitting.value = true
    submitError.value = null
    save.saving()

    const current = draft.value
    try {
      // New lines, grouped by room: the endpoint takes one room per batch and
      // writes them in a single transaction.
      const byRoom = new Map<number | null, AddedLine[]>()
      for (const line of current.added) {
        const group = byRoom.get(line.roomId) ?? []
        group.push(line)
        byRoom.set(line.roomId, group)
      }

      // **Each piece leaves the draft the moment it lands.** Submitting is not
      // one transaction — it is a handful of requests — so a failure halfway
      // must leave behind exactly the work that did *not* happen. Keeping the
      // whole draft and retrying would re-send the adds that already succeeded
      // and put every one of those lines on the quote twice.
      for (const [roomId, group] of byRoom) {
        await addQuoteLines(
          quoteId.value,
          roomId,
          group.map((line) => ({
            item_id: line.itemId,
            quantity: line.quantity,
            need: line.need,
            note: line.note,
          })),
        )
        const sent = new Set(group.map((line) => line.tempId))
        change((next) => {
          next.added = next.added.filter((line) => !sent.has(line.tempId))
        })
      }

      // The server's own figures, from whichever write answered last.
      let settled: QuoteOwnerView | null = null

      const edits = Object.entries(current.lines)
      if (edits.length > 0) {
        settled = await updateQuoteLines(
          quoteId.value,
          edits.map(([key, fields]) => ({ lineId: Number(key), fields })),
        )
        change((next) => {
          for (const [key] of edits) delete next.lines[key]
        })
      }

      if (current.charges) {
        settled = await updateQuoteCharges(quoteId.value, {
          labourPesewas: toPesewas(current.charges.labour),
          materialsPesewas: toPesewas(current.charges.materials),
          miscPesewas: toPesewas(current.charges.misc) ?? 0,
        })
        change((next) => {
          next.charges = null
        })
      }

      clearDraft(quoteId.value)
      draft.value = emptyDraft()
      mode.value = 'reading'
      expandedLineId.value = null
      save.saved()

      // A submit that patched anything already has the new totals in hand. One
      // that only added lines does not — the bulk add answers with the lines —
      // so that is the only case left that re-reads.
      if (settled) queryClient.setQueryData(quoteKeys.ownerView(quoteId.value), settled)
      else await queryClient.invalidateQueries({ queryKey: quoteKeys.ownerView(quoteId.value) })

      await queryClient.invalidateQueries({
        queryKey: [...quoteKeys.all, 'customer-view', quoteId.value],
      })
      return true
    } catch {
      // What is left of the draft is what did not land. Nothing he typed is
      // lost, and submitting again sends only the remainder.
      save.failed()
      submitError.value =
        online.value === false
          ? 'No signal. Your changes are held on this device — submit again when you have one.'
          : 'That did not go through. Your changes are still here; try submitting again.'
      return false
    } finally {
      submitting.value = false
    }
  }

  // --- what the screens read ------------------------------------------------

  const liveLines = computed(() => lines.value.filter((line) => !line.isRemoved))
  const offLines = computed(() => lines.value.filter((line) => line.isRemoved))

  const summaries = computed(() => roomSummaries(rooms.value, lines.value))
  const activeRoom = computed(
    () => summaries.value.find((room) => room.id === activeRoomId.value) ?? null,
  )
  const otherRooms = computed(() =>
    summaries.value.filter((room) => room.id !== activeRoomId.value),
  )

  /** Whole-house lines answer to the `WHOLE_HOUSE` row, not to a real room. */
  const inActiveRoom = (line: QuoteLine) =>
    activeRoomId.value === WHOLE_HOUSE
      ? line.roomId === null
      : line.roomId === activeRoomId.value

  const roomLines = computed(() => liveLines.value.filter(inActiveRoom))
  const roomOffLines = computed(() => offLines.value.filter(inActiveRoom))

  /** The count the dashed toggle says out loud, across the whole quote. */
  const offCount = computed(() => offLines.value.length)

  const byNeed = computed(() => needGroups(lines.value))

  /**
   * Labour that would go out as a derived **zero** — the one case
   * `POST /quotes/{id}/send` actually refuses, because with no rooms on the
   * quote the per-room default is nothing and sending that is almost always a
   * forgotten charge.
   */
  const labourMissing = computed(
    () => money.value?.labourIsDerived === true && money.value.labourPesewas === 0,
  )

  // --- the cost wall --------------------------------------------------------

  /**
   * One tap — but her view is a document the **server** builds, so it cannot
   * show a change that has not been submitted. Rather than show her a total
   * that is quietly out of date, unsubmitted work is sent first and the tap
   * stays one tap.
   */
  async function showHer(): Promise<void> {
    pickerOpen.value = false
    moneyOpen.value = false
    expandedLineId.value = null
    if (dirty.value) {
      const ok = await submit()
      if (!ok) return
    }
    audience.value = 'customer'
  }

  /** Only ever called by the hold, never by a tap. */
  const backToOwner = () => (audience.value = 'owner')

  // --- chrome ---------------------------------------------------------------

  function selectRoom(roomId: number) {
    chosenRoomId.value = roomId
    expandedLineId.value = null
    // Picking a room is picking what to edit, so it says which list to be on.
    groupBy.value = 'room'
  }

  function toggleLine(lineId: number) {
    if (!editable.value) return
    expandedLineId.value = expandedLineId.value === lineId ? null : lineId
  }

  function openPicker() {
    addedCount.value = 0
    pickerOpen.value = true
  }

  watch(groupBy, (value) => {
    if (value === 'need') expandedLineId.value = null
  })

  return {
    // mode
    mode,
    editable,
    locked,
    dirty,
    changeCount,
    submitting,
    submitError,
    startEditing,
    reset,
    submit,
    // state
    lines,
    money,
    charges,
    activeRoomId,
    activeRoom,
    groupBy,
    expandedLineId,
    showOff,
    pickerOpen,
    moneyOpen,
    answerOpen,
    itemised,
    addedCount,
    toast,
    audience,
    // derived
    summaries,
    otherRooms,
    roomLines,
    roomOffLines,
    offCount,
    byNeed,
    labourMissing,
    defaultNeedFor,
    search,
    // actions
    add,
    step,
    setNeed,
    setNote,
    switchOff,
    switchOn,
    setCharge,
    selectRoom,
    toggleLine,
    openPicker,
    showHer,
    backToOwner,
  }
}

export type QuoteBuilder = ReturnType<typeof useQuoteBuilder>
