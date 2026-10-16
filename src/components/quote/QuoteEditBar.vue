<script setup lang="ts">
import { computed } from 'vue'
import { SButton, SText } from '@/components/atoms'

/**
 * The way in and out of editing.
 *
 * A quote is read far more often than it is changed — he opens it to say a
 * number out loud, and only sometimes to move one — so the screen is inert
 * until he asks for it. That is also what makes the screen cheap: nothing is
 * written while he reads, and nothing while he edits either. One submit sends
 * the lot.
 *
 * `Reset` is a **reversible** removal in the sense that matters here: it throws
 * away unsubmitted work, never anything the quote already holds. It takes the
 * risk ink and keeps it through hover, because what it costs is what the button
 * is rather than a reaction to being approached.
 */
const props = defineProps<{
  editing: boolean
  dirty: boolean
  changeCount: number
  submitting: boolean
  error: string | null
  phone?: boolean
}>()

defineEmits<{ edit: []; reset: []; submit: [] }>()

const size = computed(() => (props.phone ? 'lg' : 'md') as 'lg' | 'md')

const submitLabel = computed(() => {
  if (props.submitting) return 'Submitting…'
  if (!props.dirty) return 'Nothing to submit'
  return `Submit ${props.changeCount} change${props.changeCount === 1 ? '' : 's'}`
})
</script>

<template>
  <div class="bar" :class="{ 'bar--phone': phone }">
    <SText v-if="error" type="caption" color="risk" class="error" role="alert">{{ error }}</SText>

    <SText v-else-if="editing && dirty" type="caption" color="fg-2">
      {{ changeCount }} unsubmitted change{{ changeCount === 1 ? '' : 's' }} · held on this device
    </SText>

    <SText v-else-if="editing" type="caption" color="fg-2">
      Editing. Nothing is sent until you submit.
    </SText>

    <div v-if="editing" class="buttons">
      <SButton variant="secondary-risk" :size="size" :disabled="submitting" @click="$emit('reset')">
        Reset
      </SButton>
      <SButton
        :size="size"
        :disabled="!dirty || submitting"
        :loading="submitting"
        @click="$emit('submit')"
      >
        {{ submitLabel }}
      </SButton>
    </div>

    <SButton v-else variant="secondary" :size="size" class="wide" @click="$emit('edit')">
      Edit quote
    </SButton>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.buttons {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
}

.bar--phone .buttons {
  grid-template-columns: 1fr 1.6fr;
}

.wide {
  width: 100%;
}

.error {
  /* It is said where the thing that failed is, not in a banner elsewhere. */
  line-height: 1.4;
}
</style>
