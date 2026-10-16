<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SButton, SText } from '@/components/atoms'
import QuoteCustomerView from '@/components/quote/QuoteCustomerView.vue'
import QuoteDesk from '@/components/quote/QuoteDesk.vue'
import QuotePhone from '@/components/quote/QuotePhone.vue'
import { useCatalogueItems } from '@/api/hooks/catalogue'
import { useCustomer } from '@/api/hooks/customers'
import { useHouse } from '@/api/hooks/houses'
import { useQuoteCustomerView, useQuoteOwnerView, useQuoteRooms } from '@/api/hooks/quotes'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { useQuoteBuilder } from '@/composables/useQuoteBuilder'
import { saveState } from '@/composables/useSaveState'

/**
 * Building a quote — modules 3+4, block A.
 *
 * The view owns the reads; `useQuoteBuilder` owns the editing. Five queries,
 * five fates: the lines, the rooms, the catalogue, the customer and the house
 * each fail on their own, so a house that will not load costs the header its
 * area and nothing else.
 *
 * **His view and her view are two screens, not one screen with a filter.** They
 * render from different endpoints, they have different layouts, and the switch
 * between them is instant — there is never a frame that mixes the two. Going to
 * hers is one tap; coming back is a 900 ms hold, which lives in the pill.
 *
 * Her view is mounted outside `AppLayout` and carries no band, no app bar and no
 * tabs: it fills the screen, dark, with nothing of his on it.
 */
const props = defineProps<{ quoteId: number }>()

/** Below ~900px the phone layout takes over. There is no third layout. */
const isPhone = useMediaQuery('(max-width: 899px)')
const online = useOnline()

const ownerQuery = useQuoteOwnerView(() => props.quoteId)
const roomsQuery = useQuoteRooms(() => props.quoteId)
const itemsQuery = useCatalogueItems()

const ownerView = computed(() => ownerQuery.data.value ?? null)
const rooms = computed(() => roomsQuery.data.value ?? [])
const catalogue = computed(() => itemsQuery.data.value ?? [])

// The customer and the house are read once the quote says which they are.
const customerQuery = useCustomer(() => ownerView.value?.header.customerId ?? 0)
const houseQuery = useHouse(() => ownerView.value?.header.houseId ?? 0)

const builder = useQuoteBuilder({
  quoteId: computed(() => props.quoteId),
  ownerView,
  rooms,
  catalogue,
  online,
})

/**
 * `Ama Adjei` → `Adjei`. Her view is addressed to the household, and the
 * household is the family name.
 */
const surname = computed(() => {
  const name = customerQuery.data.value?.name?.trim()
  if (!name) return 'this'
  return name.split(/\s+/).pop() as string
})

/** The house's short name stands in for the area; the wire carries no area. */
const area = computed(() => houseQuery.data.value?.label ?? null)

/**
 * The three cost-free facts her view needs that `customer-view` does not carry.
 * Null until all three are known, which is what keeps her query disabled rather
 * than letting it render "For the  home".
 */
const herFacts = computed(() => {
  const view = ownerView.value
  if (!view || !customerQuery.data.value) return null
  return {
    createdAt: view.header.createdAt,
    surname: surname.value,
    roomCount: rooms.value.length,
  }
})

const herQuery = useQuoteCustomerView(
  () => props.quoteId,
  () => builder.itemised.value,
  herFacts,
)

// --- the save dot ---------------------------------------------------------

/** When the last write landed. A time, because "saved" alone ages badly. */
const savedAt = ref<string | null>(null)

watch(saveState, (state) => {
  if (state === 'saved') {
    savedAt.value = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
})

/**
 * Nothing to flush on the way out. Every change is written to session storage
 * as he makes it, so a closed tab loses nothing and a reload picks the draft
 * back up — without a single request having been made.
 */

/**
 * `isPending` is "nothing cached yet", so a revalidation never re-skeletons.
 * The money and the lines come from the same read, so one guard covers both.
 */
const loading = computed(() => ownerQuery.isPending.value)

/** Sending is out of scope in this handoff. */
const sendStub = ref(false)
</script>

<template>
  <div class="frame">
    <!-- Her view. A separate screen, built only from customer-safe data. -->
    <QuoteCustomerView
      v-if="builder.audience.value === 'customer' && herQuery.data.value"
      :quote="herQuery.data.value"
      :phone="isPhone"
      @back="builder.backToOwner"
    />

    <template v-else-if="builder.audience.value === 'customer'">
      <!-- Her screen is already dark: it must never flash his light one while
           the document is being fetched. -->
      <div class="her-wait audience-customer">
        <!--
          If her document cannot be fetched there is nothing safe to show her,
          and the way back lives inside the view that did not render — so
          without this the screen is a dark dead end with his costs one failed
          request away and no door. The door is a plain button rather than the
          hold pill: there is nothing on screen to protect.
        -->
        <template v-if="herQuery.isError.value">
          <SText type="body" color="fg-2">This quote can’t be shown right now.</SText>
          <div class="her-actions">
            <SButton variant="secondary" :size="isPhone ? 'lg' : 'md'" @click="herQuery.refetch()">
              Try again
            </SButton>
            <SButton variant="ghost" :size="isPhone ? 'lg' : 'md'" @click="builder.backToOwner">
              Go back
            </SButton>
          </div>
        </template>
        <SText v-else type="body" color="fg-2">One moment…</SText>
      </div>
    </template>

    <template v-else-if="loading || !ownerView">
      <div class="loading">
        <div v-for="n in 6" :key="n" class="skeleton" />
      </div>
    </template>

    <QuotePhone
      v-else-if="isPhone"
      :builder="builder"
      :header="ownerView.header"
      :surname="surname"
      :area="area"
      :online="online"
      :saved-at="savedAt"
    />

    <QuoteDesk
      v-else
      :builder="builder"
      :header="ownerView.header"
      :surname="surname"
      :area="area"
      :online="online"
      :saved-at="savedAt"
      @send="sendStub = true"
    />

    <!-- `Mark sent` is a navigation stub: the endpoint exists, but sending
         freezes the quote's prices and is block B's to design. -->
    <div v-if="sendStub" class="stub-note" role="status">
      <SText type="cell">
        Sending is not part of this handoff — the quote stays a draft.
      </SText>
    </div>
  </div>
</template>

<style scoped>
.frame {
  position: relative;
  min-height: 100vh;
  background: var(--color-bg);
  /* The reference sets no line-height, so rows sit at the fonts' own metrics —
     the same reason `AppLayout` does it. This screen draws its own frame
     because her view may carry no app chrome at all, so it has to say so here.
     Without it `body`'s 1.6 adds a few pixels to every row and wraps a column
     header that the reference fits. */
  line-height: normal;
}

.her-wait {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
  background: var(--color-bg);
}

.her-actions {
  display: flex;
  gap: 8px;
}

.loading {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 32px 16px;
}

/* Real heights, so the list does not jump when the rows arrive. */
.skeleton {
  height: 56px;
  background: var(--color-surface);
  border-radius: var(--radius-chip);
}

.stub-note {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  padding: 12px 16px;
  background: var(--color-fg);
  color: var(--color-bg);
  border-radius: var(--radius-card);
  z-index: 60;
}

.stub-note :deep(.s-text) {
  color: var(--color-bg);
}
</style>
