<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { SBanner } from '@/components/atoms'
import DerivedFigureCard from '@/components/item/DerivedFigureCard.vue'
import DiscardDialog from '@/components/item/DiscardDialog.vue'
import ItemEditableFields from '@/components/item/ItemEditableFields.vue'
import ItemEditActionBar from '@/components/item/ItemEditActionBar.vue'
import ItemPhoneHeader from '@/components/item/ItemPhoneHeader.vue'
import ItemSectionRule from '@/components/item/ItemSectionRule.vue'
import SellingPriceCard from '@/components/item/SellingPriceCard.vue'
import { useUpdateItem } from '@/api/hooks/item'
import { useItemDetail } from '@/composables/useItemDetail'
import { UNTITLED, type ItemDetail } from '@/types/item'
import { toItemUpdate, toOverrideIntent } from '@/utils/mapper/itemMapper'

/**
 * B1's field set as one scrolling column, for the phone.
 *
 * Same order and same rules as the laptop: the figures the system decided first,
 * dashed, then everything he types, solid. Its fields are live the moment it
 * opens — getting here was the Edit press.
 */
const props = defineProps<{
  item: ItemDetail
  offline: boolean
}>()

const router = useRouter()

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
} = useItemDetail(toRef(props, 'item'), { editable: true, offline: () => props.offline })

const update = useUpdateItem()

const discardOpen = ref(false)
const saveError = ref('')

const saving = computed(() => update.isPending.value)

const derived = computed(() => props.item.derived)

const backToItem = () => router.push({ name: 'item-detail', params: { id: props.item.id } })

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.'

async function onSave() {
  saveError.value = ''

  const plan = toItemUpdate(draft)

  if (state.value === 'overridden') {
    const intent = toOverrideIntent(overrideDraft.value)
    if (intent.kind !== 'set') {
      saveError.value = 'That selling price is not a figure — something like 360.00.'
      return
    }
    plan.body.selling_price_override_pesewas = intent.pesewas
  } else {
    // Null is how the wire says "price it by the group markup again".
    plan.body.selling_price_override_pesewas = null
  }

  try {
    await update.mutateAsync({ id: props.item.id, body: plan.body })
    markSaved()
    // Saved is the end of this screen's job, so it hands him back to the item.
    backToItem()
  } catch (error) {
    saveError.value = message(error)
  }
}

function confirmDiscard() {
  discardOpen.value = false
  discard()
  backToItem()
}

let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => (clock = setInterval(tick, 20_000)))
onBeforeUnmount(() => clearInterval(clock))

const crumb = computed(() => `‹ ${draft.name.trim() || UNTITLED}`)

function onPhoto(file: File) {
  draft.photoUrl = URL.createObjectURL(file)
}
</script>

<template>
  <ItemPhoneHeader
    :name="draft.name"
    :group="null"
    title="Edit"
    :back-label="crumb"
    :back-to="{ name: 'item-detail', params: { id: item.id } }"
  />

  <SBanner v-if="saveError" variant="error" label="error" title="That didn't save.">
    {{ saveError }} Your changes are still here.
  </SBanner>

  <!-- Decided first, so the figures he is pricing against are read before the
       fields that move them. -->
  <div class="section section--derived">
    <ItemSectionRule>Comes from shipments &amp; movements — not typed</ItemSectionRule>
    <!-- Stacked one per row: three side by side at 390px would put `248.60` at
         the edge of its own card. -->
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
