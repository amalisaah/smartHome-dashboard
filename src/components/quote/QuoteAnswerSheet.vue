<script setup lang="ts">
import { computed, ref, toRef, useId, watch } from 'vue'
import { SButton, SInput, SText, STextarea } from '@/components/atoms'
import { useDialogKeys } from '@/composables/useDialogKeys'
import { useQuoteAnswer } from '@/composables/useQuoteAnswer'

/**
 * "What did she agree to?" — modules 3+4, block B.
 *
 * He sends the number to her on WhatsApp himself; this is where he comes back
 * and records what she actually said. One sheet with three contents — the
 * figure, the loss confirmation, and the decline — because they are three
 * moments of one answer, and a second sheet opening over the first would make
 * going back look like going somewhere.
 *
 * **The agreed figure is the only live field on the quote once it is sent.**
 * Everything behind the scrim is locked, which is what makes a bare numeric box
 * safe to put focus in the moment this opens.
 *
 * On the phone it is pinned to the bottom, where his thumb is. On the laptop the
 * same content is a centred modal: the sheet form exists because a phone's
 * reachable area is the bottom third of the screen, and a 1440px display has no
 * such constraint — pinning it there would put the one field he has to type in
 * as far from his eyes as the screen allows.
 */
const props = defineProps<{
  /** Supplied. */
  proposedPesewas: number
  /** Supplied — `money.cost_total_pesewas`. */
  floorPesewas: number
  phone?: boolean
  /** A write is in flight. Both doors go inert so it goes exactly once. */
  busy?: boolean
  /** What came back when one did not land. The sheet keeps everything typed. */
  error?: string | null
}>()

const emit = defineEmits<{
  accept: [agreedTotalPesewas: number]
  decline: [reason: string | null]
  close: []
}>()

const a = useQuoteAnswer({
  proposedPesewas: toRef(props, 'proposedPesewas'),
  floorPesewas: toRef(props, 'floorPesewas'),
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
  onDismiss: () => emit('close'),
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
const shownError = computed(() => (stale.value ? null : props.error))

function onAccept() {
  const outcome = a.pressAccept()
  if (outcome === 'accept') emit('accept', a.agreedPesewas.value as number)
}
</script>

<template>
  <div class="scrim" @mousedown.self="emit('close')">
    <div
      ref="panel"
      class="panel"
      :class="phone ? 'panel--sheet' : 'panel--modal'"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <!--
        B1, and the loss confirmation, which is B1 with its buttons changed and
        nothing else. The title and the field stay exactly where they were,
        because the likeliest reason a figure is under the floor is a dropped
        digit — and the fix for that is the box he is already looking at, not a
        screen that has replaced it.
      -->
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

        <!-- The one box that moves as he types. Amber because what it holds is
             his cost and his profit — owner-only figures — not because anything
             is wrong; it goes risk-inked only when the figure is under water. -->
        <div class="gap" :class="{ 'gap--quiet': !a.gapLine.value, 'gap--loss': a.belowFloor.value }">
          <div v-if="a.gapLine.value" class="gap-line">
            <SText type="money" :color="a.belowFloor.value ? 'risk' : 'fg-2'">
              {{ a.gapLine.value.from }}
            </SText>
            <SText type="money" :color="a.belowFloor.value ? 'risk' : 'fg'">
              {{ a.gapLine.value.profit }}
            </SText>
          </div>
          <SText type="caption" :color="a.belowFloor.value ? 'risk' : 'fg-2'">
            {{ a.floorLine.value }}
          </SText>
        </div>

        <!-- Said here, where the thing that failed is, rather than in a banner. -->
        <SText v-if="shownError" type="caption" color="risk" class="error" role="alert">
          {{ shownError }}
        </SText>

        <template v-if="a.step.value === 'confirm-loss'">
          <SText type="cell" color="fg-2">
            This job would lose you {{ a.lossText.value }}. If that is what she agreed to,
            record it — the money view has to be true. If it is a typo, the figure is
            still up there.
          </SText>
          <SButton
            variant="destructive"
            :size="phone ? 'phone-cta' : 'md'"
            :loading="busy"
            class="wide"
            @click="onAccept"
          >
            Accept anyway · creates the job
          </SButton>
          <SButton
            variant="ghost"
            :size="phone ? 'lg' : 'md'"
            :disabled="busy"
            class="wide"
            @click="a.backToAgreed"
          >
            Let me fix it
          </SButton>
        </template>

        <template v-else>
          <SButton
            :size="phone ? 'phone-cta' : 'md'"
            :disabled="!a.canAccept.value"
            :loading="busy"
            class="wide"
            @click="onAccept"
          >
            {{ a.acceptLabel.value }}
          </SButton>
          <SButton
            variant="secondary"
            :size="phone ? 'lg' : 'md'"
            :disabled="busy"
            class="wide"
            @click="a.toDeclined"
          >
            She declined
          </SButton>
        </template>
      </template>

      <!-- B2. The same sheet, swapped in place — the figure above is kept. -->
      <template v-else>
        <SText :id="titleId" type="frame-title" as="h2">Mark declined</SText>

        <STextarea
          v-model="a.reason.value"
          :rows="3"
          :size="phone ? 'phone' : 'md'"
          aria-label="Why she declined"
          placeholder="Why, if she said. Most declines are silence; leave it empty."
          :disabled="busy"
        />

        <SText v-if="shownError" type="caption" color="risk" class="error" role="alert">
          {{ shownError }}
        </SText>

        <div class="declined-buttons">
          <SButton
            variant="destructive"
            :size="phone ? 'phone-wide' : 'md'"
            :loading="busy"
            @click="emit('decline', a.reason.value.trim() || null)"
          >
            Declined
          </SButton>
          <SButton
            variant="ghost"
            :size="phone ? 'lg' : 'md'"
            :disabled="busy"
            @click="a.backToAgreed"
          >
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
 * both on it.
 */
.scrim {
  position: absolute;
  inset: 32px 0 0;
  z-index: 40;
  background: var(--color-scrim);
  display: flex;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 16px 20px;
  background: var(--color-bg);
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-line) transparent;
}

/* The phone: pinned to the bottom, full width, under his thumb. */
.panel--sheet {
  margin-top: auto;
  width: 100%;
  border-top: 1px solid var(--color-line);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  box-shadow: var(--shadow-elev-sheet);
  animation: sheet-up 200ms ease-out;
}

/* The laptop: the same content, centred, at the width the content was drawn. */
.panel--modal {
  margin: auto;
  width: 420px;
  max-width: calc(100% - 48px);
  padding: 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-2);
  animation: modal-in 200ms ease-out;
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
}

@keyframes modal-in {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel--sheet,
  .panel--modal {
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

.gap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--color-risk);
  border-radius: var(--radius-md);
  transition: border-color 120ms ease-out;
}

/*
 * Nothing typed, so there is no gap and no profit — only the floor, which is a
 * fact about the quote rather than about a figure he has entered. The amber
 * comes off with the figures it belonged to: an empty box ringed in warning
 * reads as a problem, and having typed nothing yet is not one.
 */
.gap--quiet {
  border-color: var(--color-line);
}

/* Under water. The border is already amber; what changes is the ink inside. */
.gap--loss {
  background: var(--color-row-risk-tint);
}

.gap-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.wide {
  width: 100%;
}

.declined-buttons {
  display: flex;
  gap: 8px;
}

.declined-buttons :deep(.s-btn:first-child) {
  flex: 1;
}

.error {
  line-height: 1.4;
}
</style>
