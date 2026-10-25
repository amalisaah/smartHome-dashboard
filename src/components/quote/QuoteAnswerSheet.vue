<script setup lang="ts">
import { computed, ref, toRef, useId, watch } from 'vue'
import { SButton, SInput, SText, STextarea } from '@/components/atoms'
import QuoteAnswerGap from './QuoteAnswerGap.vue'
import { useDialogKeys } from '@/composables/useDialogKeys'
import { useQuoteAnswer } from '@/composables/useQuoteAnswer'

/**
 * B1 and B2 — "What did she agree to?", the phone.
 *
 * He sends the number to her on WhatsApp himself; this is where he comes back
 * and records what she actually said. One sheet with two contents — the figure
 * and the decline — because they are two moments of one answer, and a second
 * sheet opening over the first would make going back look like going somewhere.
 *
 * **The agreed figure is the only live field on the quote once it is sent.**
 * Everything behind the scrim is locked, which is what makes a bare numeric box
 * safe to put focus in the moment this opens.
 *
 * The scrim is inert, as the laptop's is. Dismissing now means leaving the
 * quote — the sheet opens by itself on every sent quote, so closing it in place
 * would only reopen it — and a mis-tap on the lines behind it must not be the
 * thing that takes him off the screen. The way out is `‹ Quotes` in the header,
 * which B1 draws standing clear of the scrim for exactly this reason.
 *
 * The laptop is not this component. At ≥900px the same question is a centred
 * dialog with the two figures side by side — see `QuoteAnswerDialog`.
 */
const props = defineProps<{
  /** Supplied. */
  proposedPesewas: number
  /** Supplied — `money.cost_total_pesewas`. */
  floorPesewas: number
  /** Both doors write. Offline they are inert and everything typed is kept. */
  online: boolean
  /** A write is in flight. Both doors go inert so it goes exactly once. */
  busy?: boolean
  /** What came back when one did not land. The sheet keeps everything typed. */
  error?: string | null
}>()

const emit = defineEmits<{
  accept: [agreedTotalPesewas: number]
  decline: [reason: string | null]
  /** Not yet — the quote stays `sent` and he goes back to the list. */
  later: []
}>()

const a = useQuoteAnswer({
  proposedPesewas: toRef(props, 'proposedPesewas'),
  floorPesewas: toRef(props, 'floorPesewas'),
  online: toRef(props, 'online'),
})

const panel = ref<HTMLElement | null>(null)
const field = ref<InstanceType<typeof SInput> | null>(null)
const titleId = useId()

/**
 * The agreed field takes focus and its contents are selected, so the keyboard is
 * up on the right layout and his first digit replaces the proposed figure rather
 * than joining it.
 */
useDialogKeys(panel, {
  onDismiss: () => emit('later'),
  initialFocus: () => field.value?.select(),
})

/**
 * A failure belongs to the press that caused it.
 *
 * Moving to another door is a different thing to have gone wrong, so the old
 * message comes off: an accept that could not reach the server has nothing to
 * say above a decline he has not pressed yet. The next press arms it again.
 */
const stale = ref(false)
watch(() => a.step.value, () => (stale.value = true))
watch(
  () => props.busy,
  (busy) => {
    if (busy) stale.value = false
  },
)

/**
 * One line, one slot. Offline outranks a failed write, because it is the reason
 * the next press would fail too — and it says the typed figure is kept, which
 * is the only question worth answering while the signal is gone.
 */
const notice = computed(() => {
  if (!props.online) {
    return a.step.value === 'declined'
      ? 'no signal · declining needs a connection. What you’ve typed is kept.'
      : 'no signal · accepting and declining need a connection. What you’ve typed is kept.'
  }
  return stale.value ? null : props.error
})
</script>

<template>
  <div class="scrim">
    <div
      ref="panel"
      class="panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <template v-if="a.step.value !== 'declined'">
        <SText :id="titleId" type="frame-title" as="h2">What did she agree to?</SText>

        <div class="proposed">
          <SText type="cell" color="fg-2">You proposed</SText>
          <!-- Dashed, because it is derived: it is what the lines behind this
               sheet come to, and there is nothing to change about it here. -->
          <span class="proposed-figure">
            <SText type="list-figure">{{ a.proposedText.value }}</SText>
          </span>
        </div>

        <SInput
          ref="field"
          v-model="a.typed.value"
          label="She agreed to"
          label-size="lg"
          size="commit"
          variant="accent"
          mono
          align="right"
          prefix="GH₵"
          input-mode="decimal"
          enter-key-hint="done"
          :disabled="busy"
        />

        <QuoteAnswerGap
          phone
          :gap-line="a.gapLine.value"
          :floor-line="a.floorLine.value"
          :below-floor="a.belowFloor.value"
          :empty="a.empty.value"
        />

        <!-- Said here, where the thing that failed is, rather than in a banner. -->
        <SText v-if="notice" type="list-meta" color="risk" class="notice" role="status">
          {{ notice }}
        </SText>

        <SButton
          size="phone-cta"
          :disabled="!a.canAccept.value"
          :loading="busy"
          class="wide"
          @click="emit('accept', a.agreedPesewas.value as number)"
        >
          {{ a.acceptLabel.value }}
        </SButton>

        <SButton
          variant="secondary"
          size="lg"
          :disabled="busy || !a.canDecline.value"
          class="wide"
          @click="a.toDeclined"
        >
          She declined
        </SButton>
      </template>

      <!-- B2. The same sheet, swapped in place — the figure above is kept. -->
      <template v-else>
        <SText :id="titleId" type="frame-title" as="h2">Mark declined</SText>

        <STextarea
          v-model="a.reason.value"
          label="Reason · optional"
          label-size="md"
          :rows="3"
          size="phone"
          placeholder="Why, if she said. Most declines are silence; leave it empty."
          :disabled="busy"
        />

        <SText v-if="notice" type="list-meta" color="risk" class="notice" role="status">
          {{ notice }}
        </SText>

        <div class="declined-buttons">
          <SButton
            variant="destructive"
            size="phone-wide"
            :disabled="!a.canDecline.value"
            :loading="busy"
            @click="emit('decline', a.reason.value.trim() || null)"
          >
            Declined
          </SButton>
          <SButton variant="ghost" size="lg" :disabled="busy" @click="a.backToAgreed">
            Back
          </SButton>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/*
 * Below the band, as every other sheet on this surface is: the band says whose
 * view this is and that is true of the sheet too — her name and his cost are
 * both on it. The header above the lines is lifted clear of it by `QuotePhone`,
 * so `‹ Quotes` stays reachable.
 */
.scrim {
  position: absolute;
  inset: 32px 0 0;
  z-index: 40;
  background: var(--color-scrim);
  display: flex;
}

/* Pinned to the bottom, full width, under his thumb. */
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 16px 20px;
  margin-top: auto;
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-line) transparent;
  background: var(--color-bg);
  border-top: 1px solid var(--color-line);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  box-shadow: var(--shadow-elev-sheet);
  animation: sheet-up 200ms ease-out;
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel {
    animation: none;
  }
}

.proposed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.proposed-figure {
  padding: 10px 12px;
  border: 1px dashed var(--color-fg-3);
  border-radius: var(--radius-md);
}

.wide {
  width: 100%;
}

.declined-buttons {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.declined-buttons :deep(.s-btn:first-child) {
  flex: 1;
}

.notice {
  line-height: 1.4;
}
</style>
