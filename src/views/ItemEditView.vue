<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/app/AppLayout.vue'
import DerivedFigureCard from '@/components/item/DerivedFigureCard.vue'
import DiscardDialog from '@/components/item/DiscardDialog.vue'
import ItemEditableFields from '@/components/item/ItemEditableFields.vue'
import ItemEditActionBar from '@/components/item/ItemEditActionBar.vue'
import ItemPhoneHeader from '@/components/item/ItemPhoneHeader.vue'
import ItemSectionRule from '@/components/item/ItemSectionRule.vue'
import SellingPriceCard from '@/components/item/SellingPriceCard.vue'
import { useItemDetail } from '@/composables/useItemDetail'
import { useOnline } from '@/composables/useOnline'
import { mockItem } from '@/data/itemDetailMock'
import { UNTITLED } from '@/types/item'
import { toOverrideIntent } from '@/utils/mapper/itemMapper'

/**
 * The phone's Edit form — B1's field set as one scrolling column.
 *
 * It is its own route rather than a layer over the detail screen, so the phone's
 * back gesture closes the form instead of leaving the item, and so a form he is
 * halfway through survives a reload.
 *
 * Same order and same rules as B1: the figures the system decided first, dashed,
 * then everything he types, solid. There is no Save button here either — a field
 * saves when it is left, and the timestamp in the header is the confirmation.
 */
const props = defineProps<{ itemId: number }>()

const online = useOnline()
const router = useRouter()

const item = ref(mockItem(props.itemId))

const {
  draft,
  changes,
  dirty,
  status,
  tick,
  discard,
  markSaved,
  state,
  derivedPrice,
  overrideDraft,
  startOverride,
  clearOverride,
  cancelOverrideEdit,
  commitOverride,
  // This screen *is* the answer to "I want to change this", so its fields are
  // live the moment it opens. The laptop's detail screen gates them behind
  // `Edit`; getting here was that press.
} = useItemDetail(item, { editable: true, offline: () => !online.value })

const discardOpen = ref(false)
const saving = ref(false)

/** The same sequence the real mutation's `onSuccess` will run. */
async function onSave() {
  saving.value = true
  try {
    const intent = toOverrideIntent(overrideDraft.value)
    const overridePesewas =
      state.value === 'derived'
        ? null
        : intent.kind === 'set'
          ? intent.pesewas
          : derived.value.price.overridePesewas

    item.value = {
      ...item.value,
      draft: { ...draft, keywords: [...draft.keywords] },
      derived: {
        ...derived.value,
        price: { ...derived.value.price, state: state.value, overridePesewas },
      },
    }
    markSaved()
    // Saved is the end of this screen's job, so it hands him back to the item.
    router.push({ name: 'item-detail', params: { id: props.itemId } })
  } finally {
    saving.value = false
  }
}

function confirmDiscard() {
  discardOpen.value = false
  discard()
  router.push({ name: 'item-detail', params: { id: props.itemId } })
}

let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => (clock = setInterval(tick, 20_000)))
onBeforeUnmount(() => clearInterval(clock))

const derived = computed(() => item.value.derived)

/** The crumb names what he is going back to. */
const crumb = computed(() => `‹ ${draft.name.trim() || UNTITLED}`)

function onPhoto(file: File) {
  draft.photoUrl = URL.createObjectURL(file)
}
</script>

<template>
  <!-- The phone frame is the device; it carries its own header. -->
  <AppLayout :chrome="false">
    <ItemPhoneHeader
      :name="draft.name"
      :group="null"
      title="Edit"
      :back-label="crumb"
      :back-to="{ name: 'item-detail', params: { id: itemId } }"
    />

    <!-- Decided first, so the figures he is pricing against are read before the
         fields that move them. Dashed the whole way down, as on B1. -->
    <div class="section section--derived">
      <ItemSectionRule>Comes from shipments &amp; movements — not typed</ItemSectionRule>
      <!-- Stacked one per row: three of these side by side at 390px would put
           `248.60` at the edge of its own card. -->
      <DerivedFigureCard :figure="derived.landedCost" />
      <DerivedFigureCard :figure="derived.stockOnHand" />
      <DerivedFigureCard :figure="derived.margin" />

      <SellingPriceCard
        v-model:override-draft="overrideDraft"
        phone
        :price="derived.price"
        :state="state"
        :derived-price="derivedPrice"
        :landed-cost="derived.landedCost.figure"
        @override="startOverride"
        @clear="clearOverride"
        @cancel-edit="cancelOverrideEdit"
        @commit="commitOverride"
      />
    </div>

    <div class="section section--typed">
      <ItemSectionRule>Editable</ItemSectionRule>
      <ItemEditableFields
        stacked
        :draft="draft"
        :groups="item.groups"
        :units="item.units"
        @photo="onPhoto"
      />
    </div>

    <!-- The way out, at the thumb: what is unsaved, then Save and Discard. -->
    <ItemEditActionBar
      :status="status"
      :dirty="dirty"
      :saving="saving"
      @save="onSave"
      @discard="discardOpen = true"
    />

    <DiscardDialog
      v-if="discardOpen"
      :changes="changes"
      @discard="confirmDiscard"
      @keep="discardOpen = false"
    />
  </AppLayout>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

/* The same ground the right column stands on, for the same reason. */
.section--derived {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-line);
}

.section--typed {
  background: var(--color-bg);
  /* Room under the last field, so the notes are not against the screen edge. */
  padding-bottom: 32px;
}
</style>
