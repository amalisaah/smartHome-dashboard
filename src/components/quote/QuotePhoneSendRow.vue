<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'

/**
 * `Mark sent`, on the phone — the step that starts the lifecycle.
 *
 * **The quote is written on a phone and sent from one.** He builds it in her
 * living room, reads the total out to her or pastes it into WhatsApp himself,
 * and marks it sent before he has got back to the car. The laptop's send card
 * carries the same button, but a quote that could only be marked sent at a desk
 * would mean the one state change the whole module turns on waits until evening
 * — and a quote he forgets to mark leaves the money view wrong.
 *
 * It stands under the edit bar rather than in the money bar, because the money
 * bar is what the quote **comes to** and this is what he **does** with it; and
 * because at 390px the money bar is already three columns wide.
 *
 * The refusal is stated as its consequence, in the row that has the problem.
 * The short `labour not set` flag by the Proposed figure says the same fact a
 * different way — that one is about the figure he is reading, this one is about
 * the button he is reaching for.
 */
defineProps<{
  /** Labour would go out as a derived zero, which `/send` refuses. */
  labourMissing: boolean
  sending?: boolean
  /** What came back when it was refused. The quote is untouched. */
  error?: string | null
}>()

defineEmits<{ send: [] }>()
</script>

<template>
  <div class="send">
    <SText v-if="labourMissing" type="caption" color="risk">
      Labour not set. Sending will be refused until you type it.
    </SText>

    <SText v-if="error" type="caption" color="risk" class="error" role="alert">
      {{ error }}
    </SText>

    <SButton
      variant="secondary"
      size="lg"
      class="wide"
      :loading="sending"
      @click="$emit('send')"
    >
      Mark sent
    </SButton>
  </div>
</template>

<style scoped>
.send {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wide {
  width: 100%;
}

.error {
  line-height: 1.4;
}
</style>
