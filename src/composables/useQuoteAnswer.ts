import { computed, ref, type Ref } from 'vue'
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
 *
 * **A figure under the floor is accepted on one press.** It was two for a
 * while, on the reasoning that a dropped digit and a concession look identical
 * at this size. The lifecycle handoff draws that state and settles it the other
 * way: a 2px risk border, the loss said in words, and the button still live —
 * it is his call, and the screen's job is to make sure he cannot make it
 * without having read what it costs.
 */

export type AnswerStep = 'agreed' | 'declined'

interface Options {
  /** Supplied — the quote's own total. */
  proposedPesewas: Ref<number>
  /** Supplied — `money.cost_total_pesewas`. Below it, the job loses money. */
  floorPesewas: Ref<number>
  /**
   * Both doors write, so both need a connection. The typed figure and the
   * reason survive it: going offline must never cost him what he has entered.
   */
  online: Ref<boolean>
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

/**
 * A figure that can go negative — profit. A minus when it is one, and nothing
 * when it is not: `+3,405` would read as a gain over something, and profit is
 * not a gain over anything.
 */
const amount = (value: number) =>
  `${value < 0 ? MINUS : ''}${formatMoneyWhole(Math.abs(value) * 100)}`

export function useQuoteAnswer({ proposedPesewas, floorPesewas, online }: Options) {
  /**
   * B1 and B2 — one sheet, two contents. Going to B2 and back keeps the typed
   * figure, which is why the figure lives out here and not inside whichever
   * content is on screen.
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

  /**
   * Nothing to measure yet. It is its own state rather than a consequence of
   * the figures being null, because every part of the box answers to it: the
   * border goes dashed, the first line goes, the floor line asks for a figure
   * and the button names what it is waiting for.
   */
  const empty = computed(() => agreedPesewas.value === null)

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
   * Under water by a cedi or more. Rounding dust does not count: the warning
   * exists for a dropped digit, not for a pesewa.
   */
  const belowFloor = computed(() => profit.value !== null && profit.value < 0)

  /**
   * The gap box's first line. Nothing while the box is empty: there is no
   * figure to be a gap from, and `−7,952 from proposed` would be a loss he has
   * not typed.
   *
   * **Below reads `from proposed`, above reads `above proposed`.** They are not
   * one phrase with a sign in front, because they are two different pieces of
   * news: coming down off his number is a discount, and going over it is not a
   * smaller discount — it is her agreeing to more than he asked for, which he
   * should read as such rather than as a positive subtraction.
   */
  const gapLine = computed(() => {
    const value = gap.value
    if (value === null) return null
    const from =
      value === 0
        ? 'same as proposed'
        : value < 0
          ? `${MINUS}${formatMoneyWhole(-value * 100)} from proposed`
          : `+${formatMoneyWhole(value * 100)} above proposed`
    return { from, profit: `profit ${amount(profit.value as number)}` }
  })

  /**
   * The second line — and with the box empty it is the only one, because with
   * nothing typed there is no gap and no profit, and the honest thing to say is
   * what will appear once there is.
   */
  const floorLine = computed(() => {
    const clear = profit.value
    const floor = formatMoneyWhole(floorPesewas.value)
    if (clear === null) return 'Type the figure she agreed to. The difference and your profit show here.'
    if (clear < 0) {
      return `${amount(-clear)} below your floor of ${floor}. You can still accept, but the job loses money.`
    }
    return `Still ${amount(clear)} above your floor of ${floor}.`
  })

  /**
   * The primary's label follows the figure, so the button says what pressing it
   * will record. With nothing typed it asks for the figure rather than reading
   * `Accept at  · creates the job` — the button is the prompt, since it is the
   * thing he is reaching for when there is nothing in the box.
   */
  const acceptLabel = computed(() =>
    empty.value
      ? 'Type what she agreed to'
      : `Accept at ${formatMoneyExact(agreedPesewas.value as number)} · creates the job`,
  )

  /**
   * Exact, because it is what the field directly under it is seeded with: the
   * two are read against each other, and a dashed `GH₵ 23,531` above a live
   * `23,531.10` looks like a discrepancy rather than like a rounding.
   */
  const proposedFigure = computed(() => formatMoneyExact(proposedPesewas.value))
  const proposedText = computed(() => `GH₵ ${proposedFigure.value}`)

  /**
   * Nothing typed is nothing to accept, and a loss is his call and is not
   * blocked. Offline stops both doors because both of them write, and a quote
   * that looks accepted on this device and is still `sent` on the server is the
   * one outcome worse than being told to wait.
   */
  const canAccept = computed(() => !empty.value && online.value)
  const canDecline = computed(() => online.value)

  /** Back from B2. The figure survives it. */
  const backToAgreed = () => (step.value = 'agreed')
  const toDeclined = () => (step.value = 'declined')

  return {
    step,
    typed,
    reason,
    agreedPesewas,
    empty,
    belowFloor,
    canAccept,
    canDecline,
    gapLine,
    floorLine,
    acceptLabel,
    proposedFigure,
    proposedText,
    backToAgreed,
    toDeclined,
  }
}

export type QuoteAnswer = ReturnType<typeof useQuoteAnswer>
