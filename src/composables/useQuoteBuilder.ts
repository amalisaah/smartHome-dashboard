import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import {
  addQuoteLine,
  removeQuoteLine,
  restoreQuoteLine,
  updateQuoteCharges,
  updateQuoteLine,
} from '@/api/quotes'
import { quoteKeys } from '@/api/hooks/quotes'
import { ApiRequestError } from '@/api/http'
import { toQuoteLine, toQuoteOwnerView } from '@/utils/mapper/quoteMapper'
import { useSaveReporter } from '@/composables/useSaveState'
import {
  fromPesewas,
  roomSummaries,
  toPesewas,
  type ChargesDraft,
  type QuoteLine,
  type QuoteMoney,
  type QuoteOwnerView,
  type QuoteRoom,
} from '@/types/quote'
import type { CatalogueItem } from '@/types/catalogue'

/**
 * The quote builder's draft. The view owns the queries; this owns what he is
 * doing to them.
 *
 * **Edits are kept as he makes them.** There is no save button, so every change
 * goes on screen first and to the server second, and nothing on this screen ever
 * waits on the network or disables a control when it drops. What that costs is
 * the bookkeeping below: a local copy of the lines that is ahead of the record,
 * and a serial queue behind it.
 *
 * Two rhythms, because the edits are not alike. A tap — a quantity, a need, a
 * switch-off — is a complete intention and goes at once. Typing is not: a note
 * or a figure settles first, so a word half-typed is not four requests.
 *
 * Nothing here computes money. Every figure the screen shows is supplied by
 * `owner-view`; what this file does is ask for it again once a write lands.
 */

/** How long typing settles before it is sent. */
const SETTLE_MS = 600

/** A tap goes now — but off the current tick, so a double-tap is one write. */
const TAP_MS = 0

export type Audience = 'owner' | 'customer'
export type GroupBy = 'room' | 'need'

/** A line he has added that the server has not numbered yet. */
const isTempId = (id: number) => id < 0

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

  // --- what is on screen ----------------------------------------------------

  /**
   * The lines, ahead of the record. Seeded from the server and then owned here
   * until a write lands, because a refetch must never take back a tap he has
   * already seen happen.
   */
  const lines = ref<QuoteLine[]>([])
  const money = ref<QuoteMoney | null>(null)
  const charges = ref<ChargesDraft>({ labour: '', materials: '', misc: '' })

  const activeRoomId = ref<number | null>(null)
  const groupBy = ref<GroupBy>('room')
  const expandedLineId = ref<number | null>(null)
  const showOff = ref(false)
  const pickerOpen = ref(false)
  const moneyOpen = ref(false)
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

  // --- the queue ------------------------------------------------------------

  /**
   * Writes waiting to go, newest replacing oldest for the same key, drained one
   * at a time. Serial because order matters: a line added and then stepped to 3
   * must not have its PATCH overtake its POST.
   */
  const queue = new Map<string, () => Promise<void>>()
  /** What the server called a line we added optimistically. */
  const realIds = new Map<number, number>()
  let timer: ReturnType<typeof setTimeout> | null = null
  let draining = false

  const resolveId = (id: number) => (isTempId(id) ? (realIds.get(id) ?? id) : id)

  function enqueue(key: string, delay: number, run: () => Promise<void>) {
    queue.set(key, run)
    save.saving()
    if (timer) clearTimeout(timer)
    timer = setTimeout(drain, delay)
  }

  async function drain() {
    timer = null
    if (draining || !queue.size) return
    draining = true

    try {
      while (queue.size) {
        const [key, run] = queue.entries().next().value as [string, () => Promise<void>]
        try {
          await run()
          queue.delete(key)
        } catch (error) {
          // Unreachable is not refused. A dead spot keeps the work and says
          // nothing is lost; a 4xx is a real answer and the screen must stop
          // pretending otherwise.
          if (error instanceof ApiRequestError && error.isNetworkFailure) {
            save.failed()
            return
          }
          queue.delete(key)
          save.failed()
          await queryClient.invalidateQueries({ queryKey: quoteKeys.ownerView(quoteId.value) })
          return
        }
      }
      save.saved()
      // The totals are the server's. Once the writes have landed, ask again.
      await queryClient.invalidateQueries({ queryKey: quoteKeys.ownerView(quoteId.value) })
      await queryClient.invalidateQueries({
        queryKey: [...quoteKeys.all, 'customer-view', quoteId.value],
      })
    } finally {
      draining = false
    }
  }

  /** Everything still waiting, tried again — what reconnecting means here. */
  function retry() {
    if (queue.size) drain()
  }

  watch(online, (up, wasUp) => {
    if (up && wasUp === false) retry()
  })

  /** A flush that may outlive the page: the tab is going, the work is not. */
  const flushNow = () => {
    if (timer) clearTimeout(timer)
    timer = null
    if (queue.size) drain()
  }

  // --- seeding --------------------------------------------------------------

  /**
   * Take the server's answer, but never over work that is still queued. A
   * refetch that landed mid-edit would otherwise pull a quantity back under his
   * thumb.
   */
  watch(
    ownerView,
    (view) => {
      if (!view) return
      if (queue.size === 0 && !draining) {
        lines.value = view.lines
      }
      money.value = view.money
      seedCharges(view.money)
      if (activeRoomId.value === null) {
        activeRoomId.value = firstRoomWithLines(view.lines) ?? rooms.value[0]?.id ?? null
      }
    },
    { immediate: true },
  )

  watch(rooms, (list) => {
    if (activeRoomId.value === null) activeRoomId.value = list[0]?.id ?? null
  })

  function firstRoomWithLines(list: QuoteLine[]): number | null {
    return list.find((line) => !line.isRemoved && line.roomId !== null)?.roomId ?? null
  }

  /**
   * The three money boxes, from the figures the server holds.
   *
   * A charge the server is deriving leaves its box **empty**, so the derived
   * figure shows as placeholder and the border stays dashed: what is in the box
   * is what he set, and nothing else. Skipped entirely while a charges write is
   * in flight, or the echo would fight his typing.
   */
  function seedCharges(current: QuoteMoney) {
    if (queue.has('charges')) return
    charges.value = {
      labour: current.labourIsDerived ? '' : fromPesewas(current.labourPesewas),
      materials: current.materialsIsDerived ? '' : fromPesewas(current.materialsPesewas),
      misc: current.miscPesewas ? fromPesewas(current.miscPesewas) : '',
    }
  }

  // --- the catalogue --------------------------------------------------------

  /**
   * Each item's group, which is the need a new line takes and the need the
   * chips and the select draw as the default. The quote endpoints carry the
   * line's need but not the item's group, so the two are joined here.
   */
  const defaultNeeds = computed(() => {
    const map = new Map<number, string>()
    for (const item of catalogue.value) {
      if (item.group) map.set(item.id, item.group.slug)
    }
    return map
  })

  /**
   * The need the catalogue would give this item. The chips draw it dashed
   * wherever it sits — including when he has picked something else, because the
   * dash is what says "this is the one you were offered".
   */
  const defaultNeedFor = (itemId: number) => defaultNeeds.value.get(itemId) ?? null

  /**
   * The picker's results. Name and group, as the handoff says, which is why the
   * catalogue is held in memory rather than searched over the wire — `?q=`
   * matches name and keywords only.
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

  // --- adding ---------------------------------------------------------------

  let nextTempId = -1
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  function showToast(text: string) {
    toast.value = text
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = ''), 1800)
  }

  /**
   * Add to the **active room**. Tapping an item already in that room adds one to
   * its line rather than starting a second — the API has no merge, so the line
   * is found here and stepped.
   */
  function add(item: CatalogueItem) {
    const roomId = activeRoomId.value
    const existing = lines.value.find(
      (line) => !line.isRemoved && line.roomId === roomId && line.itemId === item.id,
    )

    if (existing) {
      step(existing.id, +1)
    } else {
      const id = nextTempId--
      const unit = item.sellPricePesewas ?? 0
      lines.value = [
        ...lines.value,
        {
          id,
          roomId,
          roomName: rooms.value.find((room) => room.id === roomId)?.name ?? null,
          itemId: item.id,
          itemName: item.name,
          need: item.group?.slug ?? 'control',
          quantity: 1,
          unitPricePesewas: unit,
          unitCostPesewas: item.landedCostPesewas,
          totalPesewas: unit,
          costPesewas: item.landedCostPesewas,
          note: null,
          isRemoved: false,
          removedAt: null,
          sortOrder: lines.value.length,
          // Stock is the server's to judge; a line just added says nothing
          // about stock until it answers.
          stock: null,
        },
      ]

      enqueue(`add:${id}`, TAP_MS, async () => {
        const created = await addQuoteLine(quoteId.value, {
          item_id: item.id,
          quantity: 1,
          room_id: roomId,
        })
        realIds.set(id, created.id)
        // Swap the stand-in for the real line, so its id, its totals and its
        // stock warning are the server's from here on.
        lines.value = lines.value.map((line) => (line.id === id ? toQuoteLine(created) : line))
      })
    }

    addedCount.value += 1
    const room = rooms.value.find((r) => r.id === roomId)
    showToast(`${item.name ?? 'Item'} → ${room?.name ?? 'the quote'}`)
  }

  // --- editing a line -------------------------------------------------------

  /** What each line has changed, merged, so a burst of taps is one patch. */
  const dirty = new Map<number, { quantity?: number; need?: string; note?: string | null }>()

  function patch(
    lineId: number,
    fields: { quantity?: number; need?: string; note?: string | null },
    delay: number,
  ) {
    const merged = { ...(dirty.get(lineId) ?? {}), ...fields }
    dirty.set(lineId, merged)

    enqueue(`line:${lineId}`, delay, async () => {
      dirty.delete(lineId)
      const updated = await updateQuoteLine(resolveId(lineId), merged)
      lines.value = lines.value.map((line) =>
        line.id === lineId ? { ...toQuoteLine(updated), id: line.id } : line,
      )
    })
  }

  /** The stepper. One is the minimum: taking a line out is switching it off. */
  function step(lineId: number, by: 1 | -1) {
    const line = lines.value.find((candidate) => candidate.id === lineId)
    if (!line) return
    const quantity = Math.max(1, line.quantity + by)
    if (quantity === line.quantity) return

    lines.value = lines.value.map((candidate) =>
      candidate.id === lineId
        ? {
            ...candidate,
            quantity,
            totalPesewas: candidate.unitPricePesewas * quantity,
            costPesewas: candidate.unitCostPesewas * quantity,
          }
        : candidate,
    )
    patch(lineId, { quantity }, TAP_MS)
  }

  function setNeed(lineId: number, need: string) {
    lines.value = lines.value.map((line) => (line.id === lineId ? { ...line, need } : line))
    patch(lineId, { need }, TAP_MS)
  }

  function setNote(lineId: number, note: string) {
    lines.value = lines.value.map((line) => (line.id === lineId ? { ...line, note } : line))
    patch(lineId, { note }, SETTLE_MS)
  }

  /** Switched off, never deleted: out of every total and out of her view. */
  function switchOff(lineId: number) {
    const today = new Date().toISOString()
    lines.value = lines.value.map((line) =>
      line.id === lineId ? { ...line, isRemoved: true, removedAt: today } : line,
    )
    if (expandedLineId.value === lineId) expandedLineId.value = null
    enqueue(`toggle:${lineId}`, TAP_MS, async () => {
      await removeQuoteLine(resolveId(lineId))
    })
  }

  function switchOn(lineId: number) {
    lines.value = lines.value.map((line) =>
      line.id === lineId ? { ...line, isRemoved: false, removedAt: null } : line,
    )
    enqueue(`toggle:${lineId}`, TAP_MS, async () => {
      await restoreQuoteLine(resolveId(lineId))
    })
  }

  // --- money ----------------------------------------------------------------

  /**
   * Labour, materials and misc. The charges endpoint answers with the whole
   * owner view, so the money bar moves as soon as the write lands rather than
   * waiting for a refetch.
   *
   * An emptied charge sends `null`, which is not zero — it hands the figure back
   * to the server to derive again, and the box goes dashed to say so.
   */
  function writeCharges() {
    const draft = charges.value
    enqueue('charges', SETTLE_MS, async () => {
      const updated = toQuoteOwnerView(
        await updateQuoteCharges(quoteId.value, {
          labourPesewas: toPesewas(draft.labour),
          materialsPesewas: toPesewas(draft.materials),
          miscPesewas: toPesewas(draft.misc) ?? 0,
        }),
      )
      queryClient.setQueryData(quoteKeys.ownerView(quoteId.value), updated)
      money.value = updated.money
    })
  }

  function setCharge(field: keyof ChargesDraft, value: string) {
    charges.value = { ...charges.value, [field]: value }
    writeCharges()
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

  const roomLines = computed(() =>
    liveLines.value.filter((line) => line.roomId === activeRoomId.value),
  )
  const roomOffLines = computed(() =>
    offLines.value.filter((line) => line.roomId === activeRoomId.value),
  )

  /** The count the dashed toggle says out loud, across the whole quote. */
  const offCount = computed(() => offLines.value.length)

  /**
   * Labour that would go out as a derived **zero** — the one case
   * `POST /quotes/{id}/send` actually refuses, because with no rooms on the
   * quote the per-room default is nothing and sending that is almost always a
   * forgotten charge.
   *
   * Deriving labour from the room count is not the same as not setting it, so a
   * derived figure he can see and overtype says nothing in amber. The warning
   * belongs where the refusal is.
   */
  const labourMissing = computed(
    () => money.value?.labourIsDerived === true && money.value.labourPesewas === 0,
  )

  // --- the cost wall --------------------------------------------------------

  /** One tap. It closes anything open over the quote first. */
  function showHer() {
    pickerOpen.value = false
    moneyOpen.value = false
    expandedLineId.value = null
    audience.value = 'customer'
  }

  /** Only ever called by the hold, never by a tap. */
  const backToOwner = () => (audience.value = 'owner')

  // --- chrome ---------------------------------------------------------------

  function selectRoom(roomId: number) {
    activeRoomId.value = roomId
    expandedLineId.value = null
    // Picking a room is picking what to edit, so it says which list to be on.
    groupBy.value = 'room'
  }

  function toggleLine(lineId: number) {
    expandedLineId.value = expandedLineId.value === lineId ? null : lineId
  }

  function openPicker() {
    addedCount.value = 0
    pickerOpen.value = true
  }

  watch(groupBy, (mode) => {
    if (mode === 'need') expandedLineId.value = null
  })

  onScopeDispose(() => {
    if (timer) clearTimeout(timer)
    if (toastTimer) clearTimeout(toastTimer)
    flushNow()
  })

  return {
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
    flushNow,
    retry,
  }
}

export type QuoteBuilder = ReturnType<typeof useQuoteBuilder>
