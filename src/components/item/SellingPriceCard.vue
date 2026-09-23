<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { SBadge, SButton, SInput, SText } from '@/components/atoms'
import type { ItemPrice, PriceState } from '@/types/item'

/**
 * The one card on this screen that holds both authorities, and the reason the
 * screen exists: it has to be obvious which of the two prices is in effect.
 *
 * One card, two states. The reference draws them together to document them; the
 * running card shows one and switches in place:
 *
 *   derived     — dashed chip, dashed display, `Override` button
 *   overridden  — solid action chip, solid action input, `Back to group default`
 *
 * The formula line stays in both, so the figure he would return to is on screen
 * rather than remembered.
 */
const props = defineProps<{
  price: ItemPrice
  state: PriceState
  /** The group default, formatted — shown in both states. */
  derivedPrice: string
  /** The figure the price is grown from, as the dashed card above shows it. */
  landedCost: string
  /** The 48px door, and a value row that wraps rather than crushes. */
  phone?: boolean
  /**
   * The record is being read, not typed. The override input is the one field in
   * this column, so it locks with the rest of them — and `Override`, which
   * would open it, goes with it.
   */
  locked?: boolean
}>()

const overrideDraft = defineModel<string>('overrideDraft', { required: true })

const emit = defineEmits<{
  override: []
  clear: []
  /** Escape: put the previous value back without leaving the field. */
  cancelEdit: []
  commit: []
}>()

const overrideField = ref<InstanceType<typeof SInput> | null>(null)

/**
 * Overriding hands him the derived figure, selected: the first keystroke
 * replaces a real number rather than starting from an empty box.
 */
async function startOverride() {
  emit('override')
  await nextTick()
  overrideField.value?.focus()
  const el = (overrideField.value?.$el as HTMLElement | undefined)?.querySelector('input')
  el?.select()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  emit('cancelEdit')
}
</script>

<template>
  <div class="card">
    <div class="head">
      <SText type="pane-title" as="h2">Selling price</SText>
      <!-- Dashed while the system decides it; solid action once he has. -->
      <SBadge v-if="state === 'derived'" variant="derived" size="state">derived</SBadge>
      <SBadge v-else variant="overridden" size="state">overridden</SBadge>
    </div>

    <div class="value-row">
      <template v-if="state === 'derived'">
        <!-- A display, not a disabled field: nothing to reach for, nothing in
             the tab order, and no cursor that suggests otherwise. -->
        <div class="display">
          <SText type="money" color="micro" class="prefix">GH₵</SText>
          <SText type="list-figure" color="fg-2" class="figure">{{ derivedPrice }}</SText>
        </div>
        <SButton
          variant="secondary"
          :size="phone ? 'lg' : 'md'"
          :disabled="locked"
          class="beside"
          @click="startOverride"
        >
          Override
        </SButton>
      </template>

      <template v-else>
        <SInput
          ref="overrideField"
          v-model="overrideDraft"
          variant="accent"
          :size="phone ? 'lg' : 'field'"
          :disabled="locked"
          mono
          align="right"
          prefix="GH₵"
          aria-label="Selling price override"
          class="override"
          @keydown="onKeydown"
          @change="emit('commit')"
        />
        <!-- One visible link back. No confirm — the figure it returns to is
             sitting in the formula line underneath. Gone while locked: there is
             nothing to go back from when nothing can be changed. -->
        <button
          v-if="!locked"
          type="button"
          class="link beside"
          @click="emit('clear')"
        >
          <SText type="caption" color="action">Back to group default</SText>
        </button>
      </template>
    </div>

    <!-- The price in words. It stays while overridden, prefixed with the figure
         he would go back to, so the default is never out of sight. -->
    <SText type="caption" class="formula">
      <template v-if="state === 'overridden'"
        >Group default would be <SText type="ref" color="fg">{{ derivedPrice }}</SText> — </template
      >Landed cost <SText type="ref" color="fg">{{ landedCost }}</SText> ×
      {{ price.groupName }} markup <SText type="ref" color="fg">{{ price.markup }}</SText>. Moves on
      its own whenever a shipment changes the cost.
    </SText>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.value-row {
  display: flex;
  align-items: center;
  gap: 12px;
  /* At 390px the link goes under the field rather than squeezing it. */
  flex-wrap: wrap;
}

/* The derived price. Dashed, surface-filled — the same vocabulary as the three
   cards above it, so it reads as one of the figures the system decided. */
.display {
  display: flex;
  align-items: stretch;
  flex: 1;
  min-width: 0;
  border: 1px dashed var(--color-fg-3);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
  cursor: default;
}

.prefix {
  display: flex;
  align-items: center;
  padding: 12px 10px;
  /* Dashed too: the fence inside a display he cannot type in. */
  border-right: 1px dashed var(--color-fg-3);
  flex: none;
}

.figure {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  text-align: right;
}

.override {
  flex: 1;
  min-width: 0;
}

.beside {
  flex: none;
}

/* A link, not a button — going back to the default is not an action with a
   door, it is the way out of a state. */
.link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-flag);
}

.link:hover :deep(.s-text) {
  color: var(--color-action-hover);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

/* The price spelled out in words, with the figures in mono so they can be read
   out of the sentence without reading the sentence. */
.formula {
  line-height: 1.6;
}
</style>
