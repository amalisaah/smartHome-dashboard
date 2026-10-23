<script setup lang="ts">
import { computed } from 'vue'
import { SBadge, SButton, SText } from '@/components/atoms'
import { formatCurrency, formatShortDate } from '@/utils/format'
import type { QuoteHeader } from '@/types/quote'

/**
 * What stands where `Edit quote` stands on a draft.
 *
 * A sent quote cannot be edited — its prices are frozen and she already has the
 * number — so the bar at the foot of the screen stops being the way into editing
 * and becomes **where the quote has got to, and the one thing it needs next**.
 *
 * A declined quote is the one state with no action at all. Offering one would be
 * inventing a way to argue with her answer; the reason, if he wrote one down, is
 * the whole of what there is to say.
 */
const props = defineProps<{ header: QuoteHeader; phone?: boolean }>()

defineEmits<{ answer: [] }>()

/** The state in words, in the chip vocabulary the quote list uses for it. */
const state = computed(() => {
  const header = props.header
  if (header.status === 'accepted') {
    return {
      variant: 'outcome-accepted' as const,
      text: `accepted${header.acceptedAt ? ` ${formatShortDate(header.acceptedAt)}` : ''}`,
    }
  }
  if (header.status === 'declined') {
    return {
      variant: 'outcome-declined' as const,
      text: `declined${header.declinedAt ? ` ${formatShortDate(header.declinedAt)}` : ''}`,
    }
  }
  return { variant: 'quoted' as const, text: 'sent · waiting on her' }
})

/**
 * What she agreed to, which is not what he proposed and is the figure the job
 * measures itself against. Shown only once it exists: before she answers there
 * is no agreed total, and the proposed one standing in for it would be a number
 * nobody said.
 */
const agreed = computed(() =>
  props.header.agreedTotalPesewas === null
    ? null
    : formatCurrency(props.header.agreedTotalPesewas),
)
</script>

<template>
  <div class="bar">
    <div class="state">
      <SBadge :variant="state.variant" size="inline">{{ state.text }}</SBadge>
      <SText v-if="agreed" type="money" color="fg-2">agreed {{ agreed }}</SText>
    </div>

    <!-- Only when he wrote one down. An empty one renders nothing at all — a
         dash would read as a reason he recorded. -->
    <SText v-if="header.declinedReason" type="caption" color="fg-2" class="reason">
      “{{ header.declinedReason }}”
    </SText>

    <SText v-else type="caption" color="fg-2">
      {{
        header.status === 'sent'
          ? 'Prices are frozen. The lines above are what she was sent.'
          : 'This quote is a record now. The lines above are what she was sent.'
      }}
    </SText>

    <SButton
      v-if="header.status === 'sent'"
      :size="phone ? 'lg' : 'md'"
      class="wide"
      @click="$emit('answer')"
    >
      Record her answer
    </SButton>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.state {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.reason {
  font-style: italic;
  line-height: 1.4;
}

.wide {
  width: 100%;
}
</style>
