<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/app/AppLayout.vue'
import AdjustCountSheet from '@/components/item/AdjustCountSheet.vue'
import ArchiveDialog from '@/components/item/ArchiveDialog.vue'
import DerivedFigureCard from '@/components/item/DerivedFigureCard.vue'
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
import { useItemDetail } from '@/composables/useItemDetail'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { mockItem } from '@/data/itemDetailMock'
import type { Movement } from '@/types/item'
import { formatMoneyWhole, formatShortDate } from '@/utils/format'

const props = defineProps<{ itemId: number }>()

/** Below ~900px the phone layout takes over. There is no third layout. */
const isPhone = useMediaQuery('(max-width: 899px)')

const router = useRouter()
const online = useOnline()

/**
 * Local stand-in for `GET /items/{id}`. Every figure it holds is the reference
 * frame's, because this handoff is UI and UX — the arithmetic behind a landed
 * cost, a price and a balance all live behind this line.
 */
const item = ref(mockItem(props.itemId))

const {
  editing,
  locked,
  startEditing,
  stopEditing,
  draft,
  group,
  savedLabel,
  tick,
  saveOnBlur,
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
} = useItemDetail(item)

const fields = ref<InstanceType<typeof ItemEditableFields> | null>(null)

/**
 * Pressing `Edit` puts the caret in the first field. Unlocking a form and then
 * making him find his way into it is half an action.
 */
async function onEdit() {
  startEditing()
  await nextTick()
  fields.value?.focus()
}

/** So `Saved just now` becomes `Saved 1 minute ago` without a reload. */
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => (clock = setInterval(tick, 20_000)))
onBeforeUnmount(() => clearInterval(clock))

const derived = computed(() => item.value.derived)

/** What the phone strip says out loud. `Sell` is the one figure without decimals. */
const phoneSell = computed(() =>
  state.value === 'overridden' && overrideDraft.value.trim() !== ''
    ? overrideDraft.value
    : formatMoneyWhole(derived.value.price.derivedPesewas),
)

function onPhoto(file: File) {
  // Nothing is uploaded — the zone just shows what was dropped on it.
  draft.photoUrl = URL.createObjectURL(file)
  saveOnBlur()
}

/**
 * The sheet writes a movement; it never edits a total. The balance it carries is
 * the composable's, computed from the last row — the stand-in for what the
 * endpoint will hand back.
 */
function onRecord() {
  const movement = recordMovement()
  if (!movement) return
  item.value = {
    ...item.value,
    derived: {
      ...derived.value,
      movements: [
        ...derived.value.movements,
        { ...movement, id: Date.now(), date: formatShortDate(new Date().toISOString()) },
      ],
      stockOnHand: {
        ...derived.value.stockOnHand,
        figure: String(movement.balance),
      },
    },
  }
  closeAdjust()
  saveOnBlur()
}

function onArchive() {
  archiveOpen.value = false
  // Archived is its own screen and is not in this handoff, so the way out of an
  // archived item is back to the list it has just left.
  router.push({ name: 'catalogue' })
}

// The screens these lead to are out of scope for this handoff.
const openMovement = (_movement: Movement) => {}
const openAllMovements = () => {}
</script>

<template>
  <AppLayout :chrome="!isPhone">
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
      <ItemPhoneMovements :movements="derived.movements" @open-all="openAllMovements" />
      <ItemPhoneActionBar
        @adjust="openAdjust"
        @edit="router.push({ name: 'item-edit', params: { id: itemId } })"
      />
    </template>

    <!-- B1 — laptop 1440. Edit-first: everything visible at once. -->
    <template v-else>
      <ItemDetailHeader
        :name="draft.name"
        :group="group"
        :saved-label="savedLabel"
        :offline="!online"
        :editing="editing"
        @edit="onEdit"
        @done="stopEditing"
        @archive="archiveOpen = true"
      />

      <div class="columns">
        <!-- Left: what he types. White, and solid-bordered throughout.
             `focusout` rather than `blur`, which does not bubble — the column
             hears a field being left, so no atom has to announce it. -->
        <div class="column column--typed" @focusout="saveOnBlur">
          <ItemSectionRule>Editable</ItemSectionRule>
          <ItemEditableFields
            ref="fields"
            :draft="draft"
            :groups="item.groups"
            :units="item.units"
            :locked="locked"
            @photo="onPhoto"
            @commit="saveOnBlur"
          />
        </div>

        <!-- Right: what the system decides. Surface, and dashed throughout —
             except the override input, which is solid action because it is the
             one figure in this column that is his. -->
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

          <MovementsCard
            :movements="derived.movements"
            @adjust="openAdjust"
            @open="openMovement"
          />
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
      @record="onRecord"
      @dismiss="closeAdjust"
    />

    <ArchiveDialog
      v-if="archiveOpen"
      :name="draft.name"
      @archive="onArchive"
      @dismiss="archiveOpen = false"
    />
  </AppLayout>
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

/* The background difference is the first signal that this side is not typed;
   the section label is the second; the dashed borders are the third. */
.column--derived {
  background: var(--color-surface);
}

.figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
</style>
