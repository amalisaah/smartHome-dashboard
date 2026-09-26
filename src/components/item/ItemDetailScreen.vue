<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { SBanner } from '@/components/atoms'
import AdjustCountSheet from '@/components/item/AdjustCountSheet.vue'
import ArchiveDialog from '@/components/item/ArchiveDialog.vue'
import DerivedFigureCard from '@/components/item/DerivedFigureCard.vue'
import DiscardDialog from '@/components/item/DiscardDialog.vue'
import ItemDetailHeader from '@/components/item/ItemDetailHeader.vue'
import ItemEditableFields from '@/components/item/ItemEditableFields.vue'
import ItemFigureStrip from '@/components/item/ItemFigureStrip.vue'
import ItemInfoBlock from '@/components/item/ItemInfoBlock.vue'
import ItemPhoneActionBar from '@/components/item/ItemPhoneActionBar.vue'
import ItemPhoneHeader from '@/components/item/ItemPhoneHeader.vue'
import ItemPhoneMovements from '@/components/item/ItemPhoneMovements.vue'
import ItemSectionRule from '@/components/item/ItemSectionRule.vue'
import MovementsCard from '@/components/item/MovementsCard.vue'
import SellingPriceCard from '@/components/item/SellingPriceCard.vue'
import { useAdjustItemCount, useArchiveItem, useUpdateItem } from '@/api/hooks/item'
import { useItemDetail } from '@/composables/useItemDetail'
import type { ItemDetail, Movement } from '@/types/item'
import { formatMoneyWhole } from '@/utils/format'
import { toItemUpdate, toOverrideIntent, type UnexpressibleClear } from '@/utils/mapper/itemMapper'

/**
 * The item screen in both frames. It takes a loaded record, so the draft is
 * seeded from real values on the first render — `ItemDetailView` owns the
 * queries and does not mount this until they have landed.
 */
const props = defineProps<{
  item: ItemDetail
  isPhone: boolean
  offline: boolean
}>()

const router = useRouter()

const {
  editing,
  locked,
  startEditing,
  stopEditing,
  draft,
  group,
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
  adjustOpen,
  basis,
  countDraft,
  deltaDraft,
  reason,
  freeReason,
  pressed,
  stockNow,
  reasonError,
  amountError,
  consequence,
  openAdjust,
  closeAdjust,
  recordMovement,
  archiveOpen,
} = useItemDetail(toRef(props, 'item'), { offline: () => props.offline })

const update = useUpdateItem()
const archive = useArchiveItem()
const adjust = useAdjustItemCount()

const discardOpen = ref(false)
const saveError = ref('')
const adjustError = ref('')
const refused = ref<UnexpressibleClear[]>([])

const saving = computed(() => update.isPending.value)

const derived = computed(() => props.item.derived)

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.'

/** Which clears the endpoint had no way to carry, in his words. */
const REFUSED_LABELS: Record<UnexpressibleClear, string> = {
  group: 'the group could not be emptied',
  leadTime: 'the lead time could not be emptied',
}

const refusedLine = computed(() => refused.value.map((it) => REFUSED_LABELS[it]).join(', '))

/**
 * One `PATCH` for every field, the price with them. A null override is how the
 * wire says "price it by the group markup again", so `Back to group default`
 * needs no write of its own.
 */
async function onSave() {
  saveError.value = ''
  refused.value = []

  const plan = toItemUpdate(draft)

  if (state.value === 'overridden') {
    const intent = toOverrideIntent(overrideDraft.value)
    if (intent.kind !== 'set') {
      saveError.value = 'That selling price is not a figure — something like 360.00.'
      return
    }
    plan.body.selling_price_override_pesewas = intent.pesewas
  } else {
    plan.body.selling_price_override_pesewas = null
  }

  try {
    await update.mutateAsync({ id: props.item.id, body: plan.body })
    refused.value = plan.unexpressible
    markSaved()
  } catch (error) {
    saveError.value = message(error)
  }
}

function onDiscard() {
  if (!dirty.value) {
    stopEditing()
    return
  }
  discardOpen.value = true
}

function confirmDiscard() {
  discardOpen.value = false
  saveError.value = ''
  refused.value = []
  discard()
}

const fields = ref<InstanceType<typeof ItemEditableFields> | null>(null)

/** Unlocking a form and leaving him to find his way into it is half an action. */
async function onEdit() {
  startEditing()
  await nextTick()
  fields.value?.focus()
}

/** So `Saved just now` becomes `Saved 1 minute ago` without a reload. */
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => (clock = setInterval(tick, 20_000)))
onBeforeUnmount(() => clearInterval(clock))

/** What it sells for: the override when there is one, else the group default. */
const sellPesewas = computed(() => {
  const price = derived.value.price
  if (state.value !== 'overridden') return price.derivedPesewas
  const intent = toOverrideIntent(overrideDraft.value)
  if (intent.kind === 'set') return intent.pesewas
  return price.overridePesewas ?? price.derivedPesewas
})

/** `Sell` is the one figure without decimals — it is the number he says out loud. */
const phoneSell = computed(() => formatMoneyWhole(sellPesewas.value))

/** The phone shows the recent few, not the ledger. The head counts what it shows. */
const recentMovements = computed(() => derived.value.movements.slice(0, 4))

function onPhoto(file: File) {
  // Nothing is uploaded: a dropped photo is a change to the draft like any
  // other, and Save is what commits it.
  draft.photoUrl = URL.createObjectURL(file)
}

/**
 * Commits on the press, unlike the fields. It appends to the ledger and carries
 * its own reason, so there is nothing for a Save button to batch it with.
 */
async function onRecord() {
  const movement = recordMovement()
  if (!movement) return

  adjustError.value = ''
  try {
    await adjust.mutateAsync({
      id: props.item.id,
      body: { quantity_delta: movement.delta, note: movement.description },
    })
    closeAdjust()
  } catch (error) {
    adjustError.value = message(error)
  }
}

async function onArchive() {
  try {
    await archive.mutateAsync(props.item.id)
    archiveOpen.value = false
    // Archived is its own screen and is not built, so the way out of an archived
    // item is back to the list it has just left.
    router.push({ name: 'catalogue' })
  } catch (error) {
    archiveOpen.value = false
    saveError.value = message(error)
  }
}

// The screens these lead to are not built yet.
const openMovement = (_movement: Movement) => {}
const openAllMovements = () => {}
</script>

<template>
  <!-- B2 — phone 390. Read-first: figures, then words, then one action. -->
  <template v-if="isPhone">
    <ItemPhoneHeader :name="draft.name" :group="group" />
    <ItemFigureStrip
      :stock="derived.stockOnHand.figure"
      :sell="phoneSell"
      :cost="derived.landedCost.figure"
    />
    <ItemInfoBlock
      :keywords="draft.keywords"
      :notes="draft.notes"
      :supplier="draft.supplier"
      :lead-days="draft.leadDays"
      :reorder-level="draft.reorderLevel"
    />
    <ItemPhoneMovements :movements="recentMovements" @open-all="openAllMovements" />
    <ItemPhoneActionBar
      @adjust="openAdjust"
      @edit="router.push({ name: 'item-edit', params: { id: item.id } })"
    />
  </template>

  <!-- B1 — laptop 1440. Edit-first: everything visible at once. -->
  <template v-else>
    <ItemDetailHeader
      :name="draft.name"
      :group="group"
      :status="status"
      :editing="editing"
      :dirty="dirty"
      :saving="saving"
      @edit="onEdit"
      @save="onSave"
      @discard="onDiscard"
      @cancel="stopEditing"
      @archive="archiveOpen = true"
    />

    <SBanner v-if="saveError" variant="error" label="error" title="That didn't save.">
      {{ saveError }} Your changes are still here.
    </SBanner>

    <!-- A clear the endpoint had no way to carry. Said after the fact, because
         it is not something he can do anything about from here. -->
    <SBanner v-else-if="refused.length" variant="warn" label="heads up" title="Saved, mostly.">
      {{ refusedLine }} — the API has no way to empty those yet.
    </SBanner>

    <div class="columns">
      <!-- What he types. Nothing here writes: keystrokes go to the draft store,
           and Save is the only thing that commits them. -->
      <div class="column column--typed">
        <ItemSectionRule>Editable</ItemSectionRule>
        <ItemEditableFields
          ref="fields"
          :draft="draft"
          :groups="item.groups"
          :units="item.units"
          :locked="locked"
          @photo="onPhoto"
        />
      </div>

      <!-- What the system decides. Dashed throughout, except the override
           input, which is solid action because it is the one figure here
           that is his. -->
      <div class="column column--derived">
        <ItemSectionRule>Comes from shipments &amp; movements — not typed</ItemSectionRule>

        <div class="figures">
          <DerivedFigureCard :figure="derived.landedCost" />
          <DerivedFigureCard :figure="derived.stockOnHand" />
          <DerivedFigureCard :figure="derived.margin" />
        </div>

        <SellingPriceCard
          v-model:override-draft="overrideDraft"
          :price="derived.price"
          :state="state"
          :derived-price="derivedPrice"
          :landed-cost="derived.landedCost.figure"
          :locked="locked"
          @override="startOverride"
          @clear="clearOverride"
          @cancel-edit="cancelOverrideEdit"
          @commit="commitOverride"
        />

        <MovementsCard :movements="derived.movements" @adjust="openAdjust" @open="openMovement" />
      </div>
    </div>
  </template>

  <AdjustCountSheet
    v-if="adjustOpen"
    v-model:basis="basis"
    v-model:count-draft="countDraft"
    v-model:delta-draft="deltaDraft"
    v-model:reason="reason"
    v-model:free-reason="freeReason"
    :stock-now="stockNow"
    :reason-error="reasonError"
    :amount-error="amountError"
    :consequence="consequence"
    :pressed="pressed"
    :phone="isPhone"
    :recording="adjust.isPending.value"
    :write-error="adjustError"
    @record="onRecord"
    @dismiss="closeAdjust"
  />

  <ArchiveDialog
    v-if="archiveOpen"
    :name="draft.name"
    :archiving="archive.isPending.value"
    @archive="onArchive"
    @dismiss="archiveOpen = false"
  />

  <DiscardDialog
    v-if="discardOpen"
    :changes="changes"
    @discard="confirmDiscard"
    @keep="discardOpen = false"
  />
</template>

<style scoped>
/* Two columns, two authorities. The divider is the left column's own border, so
   there is no gap for the two grounds to bleed into each other across. */
.columns {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  min-width: 0;
}

.column--typed {
  background: var(--color-bg);
  border-right: 1px solid var(--color-line);
}

.column--derived {
  background: var(--color-surface);
}

.figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
</style>
