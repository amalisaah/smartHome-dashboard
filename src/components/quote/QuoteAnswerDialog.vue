<script setup lang="ts">
import { computed, ref, toRef, useId, watch } from 'vue'
import { SButton, SInput, SText, STextarea } from '@/components/atoms'
import QuoteAnswerGap from './QuoteAnswerGap.vue'
import { useDialogKeys } from '@/composables/useDialogKeys'
import { useQuoteAnswer } from '@/composables/useQuoteAnswer'

/**
 * B3 — "What did she agree to?", the laptop.
 *
 * The same question as the phone's sheet and the same two steps, laid out for a
 * machine with a keyboard and room to compare. **The two figures sit side by
 * side**, because that is the whole of what he is doing here: reading what he
 * proposed against what she said, and the width lets him read it across rather
 * than down.
 *
 * It is a dialog rather than a sheet for the reason a sheet exists at all — a
 * phone's reachable area is the bottom third of the screen, and a 1440px
 * display has no such constraint. Pinning the one field he must type in to the
 * bottom edge would put it as far from his eyes as the screen allows.
 *
 * **The scrim does nothing.** Behind it is the frozen quote, kept legible so he
 * can read a line back to her over the phone; a stray click on it must not
 * close the thing he opened the quote to do. The ways out are named: `Esc` in
 * the corner, and `Enter` on the button.
 */
const props = defineProps<{
  /** Supplied — `<Surname> — <area>`, already joined by the caller. */
  who: string
  /** Supplied — `Quote 0142 · sent 3 days ago`. */
  sentLine: string
  /** Supplied — `Quote 0142`, for the decline step's second line. */
  quoteLabel: string
  /** Supplied. */
  proposedPesewas: number
  /** Supplied — `money.cost_total_pesewas`. */
  floorPesewas: number
  /** Both doors write. Offline they are inert and everything typed is kept. */
  online: boolean
  /** A write is in flight. Both doors go inert so it goes exactly once. */
  busy?: boolean
  /** What came back when one did not land. The dialog keeps everything typed. */
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

const dialog = ref<HTMLElement | null>(null)
const field = ref<InstanceType<typeof SInput> | null>(null)
const titleId = useId()

/**
 * Escape means two different things on the two steps, and both of them are
 * "back one" rather than "close": on the answer step there is nowhere further
 * back than the list, and on the decline step there is — the figure he typed,
 * which `backToAgreed` keeps.
 */
useDialogKeys(dialog, {
  onDismiss: () => (a.step.value === 'declined' ? a.backToAgreed() : emit('later')),
  initialFocus: () => field.value?.select(),
})

const stale = ref(false)
watch(() => a.step.value, () => (stale.value = true))
watch(
  () => props.busy,
  (busy) => {
    if (busy) stale.value = false
  },
)

/**
 * One line, one slot — the no-signal line and a failed write share it. Offline
 * outranks a failure, because it is the reason the next press would fail too.
 */
const notice = computed(() => {
  if (!props.online) {
    return a.step.value === 'declined'
      ? 'no signal · declining needs a connection. What you’ve typed is kept.'
      : 'no signal · accepting and declining need a connection. What you’ve typed is kept.'
  }
  return stale.value ? null : props.error
})

const declineLine = computed(
  () => `${props.who} · ${props.quoteLabel} · proposed ${a.proposedFigure.value}`,
)

function accept() {
  if (!a.canAccept.value || props.busy) return
  emit('accept', a.agreedPesewas.value as number)
}
</script>

<template>
  <!-- Inert, deliberately: no `@click` and no `@mousedown`. -->
  <div class="scrim">
    <div
      ref="dialog"
      class="dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <template v-if="a.step.value !== 'declined'">
        <div class="head head--answer">
          <SText :id="titleId" type="title" as="h2">What did she agree to?</SText>
          <SText type="list-meta" color="fg-2">{{ who }} · {{ sentLine }}</SText>
        </div>

        <div class="body">
          <div class="figures">
            <div class="col">
              <SText type="cell" color="fg-2" as="span">You proposed</SText>
              <!-- Dashed, because it is derived: it is what the lines behind
                   this dialog come to, and nothing here changes it. -->
              <div class="proposed">
                <SText type="list-figure" color="fg-2">GH₵</SText>
                <SText type="total">{{ a.proposedFigure.value }}</SText>
              </div>
            </div>

            <div class="col agreed">
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
                :disabled="busy"
                @keydown.enter.prevent="accept"
              />
            </div>
          </div>

          <QuoteAnswerGap
            :gap-line="a.gapLine.value"
            :floor-line="a.floorLine.value"
            :below-floor="a.belowFloor.value"
            :empty="a.empty.value"
          />

          <SText v-if="notice" type="list-meta" color="risk" class="notice" role="status">
            {{ notice }}
          </SText>

          <div class="buttons">
            <SButton
              size="phone-cta"
              class="primary"
              :disabled="!a.canAccept.value"
              :loading="busy"
              @click="accept"
            >
              {{ a.acceptLabel.value }}
              <span class="cap cap--on-fill">Enter</span>
            </SButton>

            <SButton
              variant="secondary"
              size="lg"
              :disabled="busy || !a.canDecline.value"
              @click="a.toDeclined"
            >
              She declined
            </SButton>
          </div>
        </div>

        <!--
          Last in the DOM, drawn in the header.

          The tab order the handoff asks for is agreed field → Accept → She
          declined → Not yet, and the way to get it without a positive
          `tabindex` — which would reorder the whole page, not just this dialog
          — is to put the quiet exit where it belongs in the order and place it
          where it belongs on screen.
        -->
        <SButton variant="ghost" size="sm" class="later" :disabled="busy" @click="emit('later')">
          <span class="cap">Esc</span>Not yet
        </SButton>
      </template>

      <!-- B2, as a dialog. The same box, swapped in place — the figure is kept. -->
      <template v-else>
        <div class="head">
          <SText :id="titleId" type="title" as="h2">Mark declined</SText>
          <SText type="list-meta" color="fg-2">{{ declineLine }}</SText>
        </div>

        <div class="body body--decline">
          <STextarea
            v-model="a.reason.value"
            label="Reason · optional"
            label-size="md"
            :rows="3"
            placeholder="Why, if she said. Most declines are silence; leave it empty."
            :disabled="busy"
          />

          <SText v-if="notice" type="list-meta" color="risk" class="notice" role="status">
            {{ notice }}
          </SText>

          <div class="buttons">
            <SButton
              variant="destructive"
              size="phone-wide"
              class="primary"
              :disabled="!a.canDecline.value"
              :loading="busy"
              @click="emit('decline', a.reason.value.trim() || null)"
            >
              Declined
            </SButton>

            <SButton variant="ghost" size="lg" :disabled="busy" @click="a.backToAgreed">
              <span class="cap">Esc</span>Back
            </SButton>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Everything below the mode band. The band stays legible over it: it says whose
   view this is, and that is as true of the dialog as of the quote behind it. */
.scrim {
  position: absolute;
  inset: 32px 0 0;
  z-index: 40;
  background: var(--color-scrim);
}

/* 150px from the top of the **frame**, as drawn — and the scrim already starts
   32px down, under the band it leaves legible, so the number here is what is
   left of it. */
.dialog {
  position: absolute;
  left: 50%;
  top: 118px;
  transform: translateX(-50%);
  width: 640px;
  max-width: calc(100% - 48px);
  max-height: calc(100% - 148px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-2);
  animation: dialog-in 200ms ease-out;
}

@keyframes dialog-in {
  from {
    transform: translate(-50%, 8px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dialog {
    animation: none;
  }
}

.head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 24px 16px;
  border-bottom: 1px solid var(--color-line);
}

/* Room for the exit, which is drawn here and written last. */
.head--answer {
  padding-right: 112px;
}

/* Centred where the drawn 36px button's centre is: `sm` is 32px, so it sits
   2px further down rather than 4px shorter off the same top edge. */
.later {
  position: absolute;
  top: 20px;
  right: 12px;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 24px 24px;
}

.body--decline {
  gap: 16px;
}

/* Equal halves, aligned at the foot: the two boxes are read against each other,
   so they end on the same line whatever their labels do. */
.figures {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: end;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.proposed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 56px;
  box-sizing: border-box;
  padding: 0 14px;
  border: 1px dashed var(--color-fg-3);
  border-radius: var(--radius-md);
}

/* The field is drawn at the proposed box's height rather than at the height its
   own padding gives it, because the pair is the point: 50px beside 56px reads
   as two different kinds of box, which is exactly what they are not. */
.agreed :deep(.s-input-wrap) {
  height: 56px;
}

.buttons {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

/* The quiet door stretches to the committing one rather than standing 4px
   shorter than it: `lg` is the drawn label, and the row is drawn flush. */
.primary {
  flex: 1;
  /* The key cap stands further off its label than two words of a label stand
     off each other: it is a second thing to read, not part of the sentence. */
  gap: 12px;
}

/* A key, drawn as one. Mono because it is the literal character on his
   keyboard, and quiet because it names the shortcut rather than being a second
   control — it sits inside the thing it operates, and takes the weight of the
   label it sits in. */
.cap {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: normal;
  padding: 2px 6px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-flag);
}

/* On the filled primary there is no `--line` to draw against, so it takes the
   label's own ink and stands back from it instead. */
.cap--on-fill {
  border-color: currentColor;
  font-weight: 400;
  opacity: 0.8;
}

.notice {
  line-height: 1.4;
}
</style>
