<script setup lang="ts">
import { computed, nextTick, onMounted, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { SBanner, SText } from '@/components/atoms'
import DerivedFigureCard from '@/components/item/DerivedFigureCard.vue'
import DiscardDialog from '@/components/item/DiscardDialog.vue'
import ItemDetailHeader from '@/components/item/ItemDetailHeader.vue'
import ItemEditActionBar from '@/components/item/ItemEditActionBar.vue'
import ItemEditableFields from '@/components/item/ItemEditableFields.vue'
import ItemPhoneHeader from '@/components/item/ItemPhoneHeader.vue'
import ItemSectionRule from '@/components/item/ItemSectionRule.vue'
import { useCreateItem } from '@/api/hooks/item'
import { useItemDetail } from '@/composables/useItemDetail'
import { NEW_ITEM_TITLE, type ItemDetail } from '@/types/item'
import { toItemCreate } from '@/utils/mapper/itemMapper'

/**
 * The item screen before there is an item: B1's field set, the same order and the
 * same rules, with nothing on it that an unmade record cannot answer for.
 *
 * What it drops, and why:
 *
 *   - **Movements and Adjust count.** Stock moves by an append to a ledger that
 *     does not exist yet. The first movement is the shipment that brings it in.
 *   - **Archive.** There is nothing to put away; Discard is the way out.
 *   - **The selling price.** A price is decided against a landed cost, and this
 *     item has not been bought yet — the group's markup prices it the moment a
 *     shipment does, and the override is one press away on the item itself.
 *
 * What it keeps is the whole left column, because that is the screen: every
 * field is typed here exactly as it is typed there, by the same component.
 */
const props = defineProps<{
  /** The blank record: what the fields are diffed against, and the zero figures. */
  item: ItemDetail
  isPhone: boolean
  offline: boolean
  /** A name he already typed into the catalogue's search box. */
  initialName?: string
}>()

const router = useRouter()

const { draft, group, changes, dirty, status, discard, markSaved } = useItemDetail(
  toRef(props, 'item'),
  { editable: true, creating: true, offline: () => props.offline },
)

// The search he came from is the name he meant. Never over a draft he left here:
// what is in the store is newer than the box he typed the query into.
if (props.initialName && draft.name === '') draft.name = props.initialName

const create = useCreateItem()

const discardOpen = ref(false)
const createError = ref('')

/** Nothing is red until he has tried to create — as the Adjust sheet does it. */
const pressed = ref(false)

const fields = ref<InstanceType<typeof ItemEditableFields> | null>(null)

const saving = computed(() => create.isPending.value)

const derived = computed(() => props.item.derived)

/**
 * The one field the item cannot be made without. Said as the consequence, in the
 * row that has the problem — an item with no name is a row he cannot find again.
 */
const nameError = computed(() =>
  pressed.value && draft.name.trim() === ''
    ? 'Blocks creating — an item is found by its name.'
    : '',
)

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.'

const leave = () => router.push({ name: 'catalogue' })

/**
 * The id is minted here, by the save — which is why this screen had no id to be
 * addressed by until now. `replace`, so the back gesture goes to the catalogue
 * rather than to a form that no longer has anything to create.
 */
async function onCreate() {
  pressed.value = true
  createError.value = ''

  if (draft.name.trim() === '') {
    fields.value?.focus()
    return
  }

  try {
    const record = await create.mutateAsync(toItemCreate(draft))
    markSaved()
    router.replace({ name: 'item-detail', params: { id: record.id } })
  } catch (error) {
    createError.value = message(error)
  }
}

function onDiscard() {
  // Nothing typed is nothing to confirm: the press is just the way out.
  if (!dirty.value) {
    leave()
    return
  }
  discardOpen.value = true
}

function confirmDiscard() {
  discardOpen.value = false
  discard()
  leave()
}

function onPhoto(file: File) {
  // Nothing is uploaded: the photo is part of the draft, and Create commits it.
  draft.photoUrl = URL.createObjectURL(file)
}

/**
 * He came here to name something. Not on the phone, where it would open the
 * keyboard over a form he has not read yet.
 */
onMounted(async () => {
  if (props.isPhone) return
  await nextTick()
  fields.value?.focus()
})
</script>

<template>
  <!-- B2 — phone 390. The fields first: the derived block is a promise, not a
       reading, until a shipment has been received. -->
  <template v-if="isPhone">
    <ItemPhoneHeader
      :name="draft.name"
      :group="group"
      :title="NEW_ITEM_TITLE"
      back-label="‹ Catalogue"
      :back-to="{ name: 'catalogue' }"
    />

    <SBanner v-if="createError" variant="error" label="error" title="That didn't save.">
      {{ createError }} Everything you typed is still here.
    </SBanner>

    <div class="section section--typed">
      <ItemSectionRule>Editable</ItemSectionRule>
      <ItemEditableFields
        ref="fields"
        stacked
        :draft="draft"
        :groups="item.groups"
        :units="item.units"
        :name-error="nameError"
        @photo="onPhoto"
      />
    </div>

    <div class="section section--derived">
      <ItemSectionRule>Comes from shipments &amp; movements — not typed</ItemSectionRule>
      <DerivedFigureCard :figure="derived.landedCost" />
      <DerivedFigureCard :figure="derived.stockOnHand" />
      <DerivedFigureCard :figure="derived.margin" />
      <SText type="caption" class="promise">
        None of this is typed. Cost, stock and margin fill in when a shipment brings this item in,
        and the selling price follows its group's markup from then on.
      </SText>
    </div>

    <ItemEditActionBar
      creating
      :status="status"
      :dirty="dirty"
      :saving="saving"
      @save="onCreate"
      @discard="onDiscard"
    />
  </template>

  <!-- B1 — laptop 1440. The same two columns, two authorities. -->
  <template v-else>
    <ItemDetailHeader
      creating
      :name="draft.name"
      :group="group"
      :status="status"
      :dirty="dirty"
      :saving="saving"
      @save="onCreate"
      @discard="onDiscard"
      @cancel="leave"
    />

    <SBanner v-if="createError" variant="error" label="error" title="That didn't save.">
      {{ createError }} Everything you typed is still here.
    </SBanner>

    <div class="columns">
      <div class="column column--typed">
        <ItemSectionRule>Editable</ItemSectionRule>
        <ItemEditableFields
          ref="fields"
          :draft="draft"
          :groups="item.groups"
          :units="item.units"
          :name-error="nameError"
          @photo="onPhoto"
        />
      </div>

      <div class="column column--derived">
        <ItemSectionRule>Comes from shipments &amp; movements — not typed</ItemSectionRule>

        <div class="figures">
          <DerivedFigureCard :figure="derived.landedCost" />
          <DerivedFigureCard :figure="derived.stockOnHand" />
          <DerivedFigureCard :figure="derived.margin" />
        </div>

        <!-- The zeros are honest rather than decorative: this is where he will
             read them, and these are the words they will carry until the first
             shipment lands. -->
        <SText type="caption" class="promise">
          None of this is typed. Cost, stock and margin fill in when a shipment brings this item in,
          and the selling price follows its group's markup from then on — you can fix a price of
          your own from the item once it has a cost to price against.
        </SText>
      </div>
    </div>
  </template>

  <DiscardDialog
    v-if="discardOpen"
    creating
    :changes="changes"
    @discard="confirmDiscard"
    @keep="discardOpen = false"
  />
</template>

<style scoped>
/* The detail screen's geometry, so the form he creates in and the record he
   reads afterwards are the same screen. */
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

.promise {
  line-height: 1.6;
}

/* The phone: one column, the same two grounds. */
.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.section--typed {
  background: var(--color-bg);
}

.section--derived {
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  /* Room under the last card, so it is not against the action bar. */
  padding-bottom: 32px;
}
</style>
