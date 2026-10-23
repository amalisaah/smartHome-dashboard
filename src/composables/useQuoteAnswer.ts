import { computed, ref, watch, type Ref } from 'vue'
import { formatMoneyExact, formatMoneyWhole } from '@/utils/format'
import { toPesewas } from '@/types/quote'

/**
 * Recording what she agreed to — modules 3+4, block B.
 *
 * Everything the sheet says follows from one typed figure measured against two
 * supplied ones: what he proposed, and the floor below which the job loses him
 * money. The sheet renders this; it decides nothing.
 *
 * **Profit and headroom are the same number, and that is not a coincidence.**
 * The floor is `cost_total` — what the job costs him — so what he makes at the
 * agreed figure and what that figure clears the floor by are the same
 * subtraction. They are said twice because they answer two different questions
 * ("what do I get out of this?" and "how close am I to the edge?"), and
 * computed once so the two can never disagree.
 */

export type AnswerStep = 'agreed' | 'confirm-loss' | 'declined'

interface Options {
  /** Supplied — the quote's own total. */
  proposedPesewas: Ref<number>
  /** Supplied — `money.cost_total_pesewas`. Below it, the job loses money. */
  floorPesewas: Ref<number>
}

/** The typographic minus, not a hyphen: these sit in mono beside each other. */
const MINUS = '−'

/**
 * **The figure he records keeps its pesewas; the figures he reads do not.**
 *
 * A quote total is rarely round — a derived materials charge leaves odd pesewas
 * on the end — and the two kinds of money on this sheet want opposite things
 * from that. The agreed total *is* the record, so it is exact: ten pesewas
 * rounded off here is ten pesewas wrong in the job's profit forever. The gap,
 * the profit and the floor are a reading of it, taken while he decides, in the
 * units he decides in; `−2,531.10 from proposed` is noise around a number he is
 * weighing against a figure she said on the phone.
 *
 * So the gap box works in whole cedis throughout — including the comparison, so
 * it can never print `−0 from proposed` for a difference it then rounds away.
 */
const cedis = (pesewas: number) => Math.round(pesewas / 100)

/** A difference, read as a direction: `−2,531`, `+1,469`. */
const difference = (value: number) =>
  `${value < 0 ? MINUS : '+'}${formatMoneyWhole(Math.abs(value) * 100)}`

/**
 * A figure that can go negative — profit. A minus when it is one, and nothing
 * when it is not: `+3,405` would read as a gain over something, and profit is
 * not a gain over anything.
 */
const amount = (value: number) =>
  `${value < 0 ? MINUS : ''}${formatMoneyWhole(Math.abs(value) * 100)}`

export function useQuoteAnswer({ proposedPesewas, floorPesewas }: Options) {
  /**
   * B1, the loss confirmation, and B2 — one sheet, three contents. Going to B2
   * and back keeps the typed figure, which is why the figure lives out here and
   * not inside whichever content is on screen.
   */
  const step = ref<AnswerStep>('agreed')

  /**
   * Seeded with the proposed total, because the common answer is yes: a quote
   * she agreed to as sent should be one tap, not a figure retyped from the line
   * above it. Grouped, so it reads as the figure it will be rather than as a
   * string of digits — `toPesewas` takes the commas back out — and **exact**,
   * so accepting it untouched records the total she was actually sent.
   *
   * The field selects its contents when the sheet opens, so typing a different
   * number replaces this one rather than appending to it.
   */
  const typed = ref(formatMoneyExact(proposedPesewas.value))

  /** Optional, and usually empty. Most declines are silence. */
  const reason = ref('')

  /** Null while the box is empty or holds something that is not yet a number. */
  const agreedPesewas = computed(() => toPesewas(typed.value))

  /** In cedis, like everything else the gap box says. */
  const gap = computed(() =>
    agreedPesewas.value === null
      ? null
      : cedis(agreedPesewas.value) - cedis(proposedPesewas.value),
  )

  /** What he makes, and what he clears the floor by. One subtraction. */
  const profit = computed(() =>
    agreedPesewas.value === null ? null : cedis(agreedPesewas.value) - cedis(floorPesewas.value),
  )

  /**
   * Under water by a cedi or more. Rounding dust does not count: the
   * confirmation exists for a dropped digit, not for a pesewa.
   */
  const belowFloor = computed(() => profit.value !== null && profit.value < 0)

  /**
   * Fixing the figure answers the question the confirmation was asking, so the
   * confirmation goes — he should not have to press `Let me fix it` after
   * already having fixed it.
   */
  watch(belowFloor, (under) => {
    if (!under && step.value === 'confirm-loss') step.value = 'agreed'
  })

  /**
   * The gap box's first line. Nothing while the box is empty: there is no
   * figure to be a gap from, and `−7,952 from proposed` would be a loss he has
   * not typed.
   */
  const gapLine = computed(() => {
    if (gap.value === null) return null
    return {
      from: gap.value === 0 ? 'same as proposed' : `${difference(gap.value)} from proposed`,
      profit: `profit ${amount(profit.value as number)}`,
    }
  })

  /**
   * The second line — and with the box empty it is the only one, because the
   * floor is the one thing still true when he has typed nothing.
   */
  const floorLine = computed(() => {
    const clear = profit.value
    const floor = formatMoneyWhole(floorPesewas.value)
    if (clear === null) return `Your floor is ${floor}.`
    if (clear < 0) {
      return `Below your floor of ${floor} — you lose ${amount(-clear)} on this job.`
    }
    return `Still ${amount(clear)} above your floor of ${floor}.`
  })

  /**
   * The primary's label follows the figure, so the button says what pressing it
   * will record. With nothing typed it names the act without a figure rather
   * than reading `Accept at  · creates the job`.
   */
  const acceptLabel = computed(() =>
    agreedPesewas.value === null
      ? 'Accept · creates the job'
      : `Accept at ${formatMoneyExact(agreedPesewas.value)} · creates the job`,
  )

  /**
   * Exact, because it is what the field directly under it is seeded with: the
   * two are read against each other, and a dashed `GH₵ 23,531` above a live
   * `23,531.10` looks like a discrepancy rather than like a rounding.
   */
  const proposedText = computed(() => `GH₵ ${formatMoneyExact(proposedPesewas.value)}`)

  /** Nothing typed is nothing to accept. A loss is his call, and is not blocked. */
  const canAccept = computed(() => agreedPesewas.value !== null)

  /**
   * What pressing Accept does. Below the floor it asks once — not because the
   * figure is wrong, but because at this size a mistyped digit and a concession
   * look identical, and only one of them is worth a second press.
   */
  function pressAccept(): 'accept' | 'confirm' | 'nothing' {
    if (!canAccept.value) return 'nothing'
    if (belowFloor.value && step.value !== 'confirm-loss') {
      step.value = 'confirm-loss'
      return 'confirm'
    }
    return 'accept'
  }

  const lossText = computed(() =>
    profit.value !== null && profit.value < 0 ? amount(-profit.value) : '0',
  )

  /** Back from B2 or from the loss confirmation. The figure survives both. */
  const backToAgreed = () => (step.value = 'agreed')
  const toDeclined = () => (step.value = 'declined')

  return {
    step,
    typed,
    reason,
    agreedPesewas,
    belowFloor,
    canAccept,
    gapLine,
    floorLine,
    acceptLabel,
    proposedText,
    lossText,
    pressAccept,
    backToAgreed,
    toDeclined,
  }
}

export type QuoteAnswer = ReturnType<typeof useQuoteAnswer>
