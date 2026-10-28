import { computed, onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useCompleteJob, useSetCharged, useSetFitted, useSetJobType } from '@/api/hooks/jobDetail'
import { useSaveReporter } from '@/composables/useSaveState'
import { JOB_TYPES, isReadOnly, type JobLineRow, type JobLinesView, type JobRecord } from '@/types/job'
import type { ApiJobType, ApiNegativeStock } from '@/types/jobApi'
import { changeFor, groupByRoom } from '@/utils/mapper/jobMapper'

/**
 * Block C's screen state — what he is typing, and what has been sent.
 *
 * **There is no Save button and nothing waits on the network.** A Fitted figure
 * he types shows its chip, its Charged and its Cost immediately, because all
 * three are that figure times a unit price the line already carries — the same
 * multiplication the server does, done locally so the row never lags the
 * keystroke.
 *
 * The one thing deliberately *not* local is profit. It is the agreed total
 * minus a cost that includes misc spending this screen does not hold, so a
 * local figure would be confidently wrong in a way a stale one is not. It is
 * re-read from `/summary` once each write lands.
 */

/** How long typing settles before the figure goes. */
const SETTLE_MS = 600

/** And the longest a figure may sit unsent while he keeps typing. */
const MAX_WAIT_MS = 4000

/** The Charged field, and each line, are their own settling write. */
const CHARGED = 'charged'
const lineKey = (lineId: number) => `line:${lineId}`

export function useJobRecording(
  jobId: MaybeRefOrGetter<number>,
  record: MaybeRefOrGetter<JobRecord | null>,
) {
  const id = computed(() => toValue(jobId))
  const job = computed(() => toValue(record))

  const save = useSaveReporter()
  const fittedMutation = useSetFitted()
  const typeMutation = useSetJobType()
  const chargedMutation = useSetCharged()
  const completion = useCompleteJob()

  /**
   * The table opens on Differences, every time. It is a view of the same lines
   * rather than a fact about the job, so it is not persisted — he opens this
   * screen to correct the few lines that changed, and it should open on them.
   */
  const view = ref<JobLinesView>('differences')

  const readOnly = computed(() => (job.value === null ? true : isReadOnly(job.value.status)))

  // --- what he has typed, before it has been sent ----------------------------

  /**
   * Fitted figures as strings, keyed by line. Strings, because a half-typed
   * field is briefly empty, and reading that as 0 would flash `not fitted` at
   * him between two digits.
   */
  const typedFitted = ref<Record<number, string>>({})

  /** The Charged field, same reasoning. Null while it reads from the record. */
  const typedCharged = ref<string | null>(null)

  /** His pick, standing over the record's until the write lands. */
  const pickedType = ref<ApiJobType | null>(null)

  const jobType = computed<ApiJobType>(() => pickedType.value ?? job.value?.jobType ?? 'install')

  /** A choice the record has caught up with is no longer his to hold. */
  watch(job, (next) => {
    if (next !== null && pickedType.value === next.jobType) pickedType.value = null
  })

  // --- the lines -------------------------------------------------------------

  /** A figure in a field, once it is a figure. Null while it is half-typed. */
  function typedCount(raw: string | undefined): number | null {
    if (raw === undefined) return null
    const value = Number.parseInt(raw, 10)
    return Number.isFinite(value) && value >= 0 ? value : null
  }

  /**
   * Every row, with his unsent figures standing over the record's.
   *
   * The chip, the Charged and the Cost are all recomputed from the figure in
   * the field. `changeFor` is the same rule the mapper applies to the wire, so
   * a row he has just edited and a row the server has answered for read
   * identically — there is no second vocabulary for a pending change.
   */
  const rows = computed<JobLineRow[]>(() => {
    const all = (job.value?.groups ?? []).flatMap((group) => group.rows)

    return all.map((row) => {
      const fitted = typedCount(typedFitted.value[row.id])
      if (fitted === null) return row

      return {
        ...row,
        fitted,
        change: changeFor({
          quantity: fitted,
          quoted_quantity: row.quotedQuantity,
          // Swapping the item is not something this screen does, so what the
          // record says about it is still true after a quantity edit.
          is_substitution: row.change?.kind === 'swapped',
        }),
        chargedPesewas: fitted * row.unitSellingPricePesewas,
        costPesewas: fitted * row.unitLandedCostPesewas,
      }
    })
  })

  /**
   * Rows under the room they went in. In Differences, a room whose every line
   * went in as quoted has nothing to show and loses its header with its rows —
   * a bare room name over nothing would read as a room he fitted nothing in.
   */
  const groups = computed(() =>
    groupByRoom(view.value === 'all' ? rows.value : rows.value.filter((row) => row.change !== null)),
  )

  const differingCount = computed(() => rows.value.filter((row) => row.change !== null).length)
  const lineCount = computed(() => rows.value.length)
  const asQuotedCount = computed(() => lineCount.value - differingCount.value)

  /**
   * How many devices completing will draw from stock. Counted from the rows on
   * screen rather than asked for, so the complete bar's sentence and the table
   * above it can never disagree about what is being committed.
   */
  const deviceCount = computed(() => rows.value.reduce((total, row) => total + row.fitted, 0))

  const consequence = computed(
    () => JOB_TYPES.find((type) => type.value === jobType.value)?.consequence(deviceCount.value) ?? '',
  )

  // --- the Charged field -----------------------------------------------------

  const chargedValue = computed(
    () => typedCharged.value ?? String((job.value?.money.chargedPesewas ?? 0) / 100),
  )

  const chargedPesewas = computed(() => {
    const value = Math.round(Number.parseFloat(chargedValue.value) * 100)
    return Number.isFinite(value) && value >= 0 ? value : null
  })

  /**
   * Dashed while it is still the figure the quote carried, solid once he has
   * moved it. Tested against the wire rather than against a flag, so it
   * survives a reload — the system's dashed/solid rule is about where a value
   * came from, not about whether this session happened to touch it.
   *
   * A job with no quote behind it has no original to differ from, so its field
   * is solid from the start: the figure in it was only ever typed.
   */
  const chargedIsEdited = computed(() => {
    const quoted = job.value?.quoteAgreedPesewas ?? null
    if (quoted === null) return true
    return chargedPesewas.value !== quoted
  })

  // --- sending ---------------------------------------------------------------

  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const waitingSince = new Map<string, number>()

  function cancel(key: string) {
    const timer = timers.get(key)
    if (timer !== undefined) clearTimeout(timer)
    timers.delete(key)
    waitingSince.delete(key)
  }

  /** Leaving the screen must not fire a write at it a moment later. */
  onScopeDispose(() => {
    for (const key of [...timers.keys()]) cancel(key)
  })

  /**
   * Hold a write until typing settles — unless it has already waited long
   * enough, in which case it goes with this keystroke rather than being pushed
   * another settle down the road.
   */
  function schedule(key: string, send: () => void) {
    const first = waitingSince.get(key) ?? Date.now()
    cancel(key)

    if (Date.now() - first >= MAX_WAIT_MS) {
      send()
      return
    }

    waitingSince.set(key, first)
    timers.set(
      key,
      setTimeout(() => {
        cancel(key)
        send()
      }, SETTLE_MS),
    )
  }

  /**
   * Report into the app bar, which is where this app says save state.
   *
   * A failure leaves what he typed in the field. The bar says it did not land,
   * and the next keystroke tries again — nothing is thrown away, and no control
   * is disabled, because this screen may not wait on the network.
   */
  async function report(run: () => Promise<unknown>) {
    save.saving()
    try {
      await run()
      save.saved()
    } catch {
      save.failed()
    }
  }

  /** Send one line's figure, and stop standing over the record once it lands. */
  async function sendFitted(lineId: number, quantity: number) {
    await fittedMutation.mutateAsync({ jobId: id.value, lineId, quantity })
    const next = { ...typedFitted.value }
    delete next[lineId]
    typedFitted.value = next
  }

  function editFitted(lineId: number, raw: string) {
    typedFitted.value = { ...typedFitted.value, [lineId]: raw }

    const quantity = typedCount(raw)
    if (quantity === null) return

    schedule(lineKey(lineId), () => void report(() => sendFitted(lineId, quantity)))
  }

  /** Leaving a field sends it now rather than when the settle would have. */
  function commitFitted(lineId: number) {
    const key = lineKey(lineId)
    if (!timers.has(key)) return
    cancel(key)

    const quantity = typedCount(typedFitted.value[lineId])
    if (quantity === null) return

    void report(() => sendFitted(lineId, quantity))
  }

  function editCharged(raw: string) {
    typedCharged.value = raw
    const pesewas = chargedPesewas.value
    if (pesewas === null) return

    schedule(CHARGED, () =>
      void report(async () => {
        await chargedMutation.mutateAsync({ id: id.value, agreedTotalPesewas: pesewas })
        typedCharged.value = null
      }),
    )
  }

  function commitCharged() {
    if (!timers.has(CHARGED)) return
    cancel(CHARGED)

    const pesewas = chargedPesewas.value
    if (pesewas === null) return

    void report(async () => {
      await chargedMutation.mutateAsync({ id: id.value, agreedTotalPesewas: pesewas })
      typedCharged.value = null
    })
  }

  /** A radio has no half-finished state, so it goes on the tap. */
  function pickType(next: ApiJobType) {
    pickedType.value = next
    void report(() => typeMutation.mutateAsync({ id: id.value, jobType: next }))
  }

  // --- completing ------------------------------------------------------------

  /**
   * What the completion did that he could not have known beforehand.
   *
   * Stock going under never blocked the write — it is a device fitted before
   * its shipment was logged, which is a true negative rather than a mistake.
   * The screen names the items **after** the fact, because the alternative is a
   * confirmation step at 10pm that gets abandoned with the job unrecorded.
   */
  const wentNegative = ref<ApiNegativeStock[]>([])

  /**
   * Everything still settling goes first, in series.
   *
   * Not a nicety: completing draws the lines out of stock, so a figure still
   * waiting out its settle would be drawn at the quantity he has already
   * corrected on screen.
   */
  async function complete() {
    for (const key of [...timers.keys()]) cancel(key)

    for (const [lineId, raw] of Object.entries(typedFitted.value)) {
      const quantity = typedCount(raw)
      if (quantity !== null) await sendFitted(Number(lineId), quantity)
    }

    const pending = chargedPesewas.value
    if (typedCharged.value !== null && pending !== null) {
      await chargedMutation.mutateAsync({ id: id.value, agreedTotalPesewas: pending })
      typedCharged.value = null
    }

    const result = await completion.mutateAsync({ id: id.value })
    wentNegative.value = result.stock.negative_stock
  }

  return {
    view,
    readOnly,
    jobType,
    consequence,
    groups,
    differingCount,
    lineCount,
    asQuotedCount,
    deviceCount,
    fittedValue: (lineId: number, fitted: number) => typedFitted.value[lineId] ?? String(fitted),
    chargedValue,
    chargedIsEdited,
    wentNegative,
    completing: computed(() => completion.isPending.value),
    completeFailed: computed(() => completion.isError.value),
    editFitted,
    commitFitted,
    editCharged,
    commitCharged,
    pickType,
    complete,
  }
}
