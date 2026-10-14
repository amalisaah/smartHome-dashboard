<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import { useQuotes } from '@/api/hooks/quotes'
import { useMediaQuery } from '@/composables/useMediaQuery'

/**
 * A navigation stub. The quote list is out of scope in this handoff — block A
 * is the builder — and this route exists so `‹ Quotes` and the `Quotes ›`
 * breadcrumb are not dead clicks.
 *
 * It offers a way into the one quote the builder is built against rather than
 * listing none, because a stub that cannot be walked past is worse than no
 * stub at all.
 */
const isPhone = useMediaQuery('(max-width: 899px)')
const router = useRouter()

/**
 * The way in, until the list exists. It is the most recent real quote rather
 * than a remembered id, so the stub cannot send him to a quote that is not
 * there.
 */
const quotesQuery = useQuotes()
const latest = computed(() => quotesQuery.data.value?.[0] ?? null)

const size = computed(() => (isPhone.value ? 'lg' : 'md') as 'lg' | 'md')
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <div class="stub">
      <SText type="micro">not in this handoff</SText>
      <SText type="title" as="h1">Quotes</SText>
      <SText type="body" color="fg-2">
        The list of quotes — who they are for, what they came to and where each one has got to.
        It is designed separately; this handoff covers building one.
      </SText>
      <div class="actions">
        <SButton
          :size="size"
          :disabled="!latest"
          @click="latest && router.push({ name: 'quote-builder', params: { id: latest.id } })"
        >
          {{ latest ? `Open quote ${String(latest.id).padStart(4, '0')}` : 'No quotes yet' }}
        </SButton>
        <SButton variant="secondary" :size="size" @click="router.push({ name: 'catalogue' })">
          Back to the catalogue
        </SButton>
      </div>
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

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
}
</style>
