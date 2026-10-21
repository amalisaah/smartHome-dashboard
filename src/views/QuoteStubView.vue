<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'

/**
 * The four places a quote list row can go that are designed elsewhere.
 *
 * They exist so that **every row on the list is a live tap**. A row whose
 * destination does not exist yet is worse than one that is greyed out: he taps
 * it, nothing happens, and he has no way to tell a missing screen from a
 * missing quote. Each of these says which block it is waiting on and leaves the
 * way back.
 *
 * `draft` is the exception and is not here — it opens the quote builder, which
 * is built.
 */
const props = withDefaults(
  defineProps<{
    /** The quote's id, or the job number for `job`. A new quote has neither. */
    reference?: number
    destination: 'new' | 'answer' | 'read-only' | 'job'
  }>(),
  { reference: 0 },
)

const isPhone = useMediaQuery('(max-width: 899px)')
const router = useRouter()

const ref4 = computed(() => String(props.reference).padStart(4, '0'))

const TITLE: Record<typeof props.destination, (ref: string) => string> = {
  new: () => 'A new quote',
  answer: (id) => `Quote ${id} · what did she agree to?`,
  'read-only': (id) => `Quote ${id}`,
  job: (id) => `Job ${id}`,
}

const DETAIL: Record<typeof props.destination, string> = {
  new: 'Starting a quote picks the customer and the house first, then opens the builder on a quote the server has numbered. That picker is block G and is not designed yet — so there is no blank quote to open, and no id to open it at.',
  answer:
    'Block B — recording her answer against what you proposed, line by line, and accepting or declining the quote. It is the screen a waiting row exists to reach: once she replies on WhatsApp, this is one tap away.',
  'read-only':
    'A declined quote, read-only. Everything that was on it stays recorded; nothing here can be changed. Out of scope in this handoff.',
  job: 'Block C — recording the job: what was actually fitted, what it cost and what she has paid. An accepted quote leads here.',
}

const title = computed(() => TITLE[props.destination](ref4.value))
const detail = computed(() => DETAIL[props.destination])
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <div class="stub">
      <SText type="micro">not in this handoff</SText>
      <SText type="title" as="h1">{{ title }}</SText>
      <SText type="body" color="fg-2">{{ detail }}</SText>
      <SButton
        variant="secondary"
        :size="isPhone ? 'lg' : 'md'"
        @click="router.push({ name: 'quotes' })"
      >
        Back to the quotes
      </SButton>
    </div>
  </AppLayout>
</template>

<style scoped>
.stub {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 32px 20px;
  max-width: 620px;
}
</style>
