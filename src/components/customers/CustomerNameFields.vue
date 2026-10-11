<script setup lang="ts">
import { ref } from 'vue'
import { SInput } from '@/components/atoms'
import type { CustomerIdentityFields } from '@/types/customers'

/**
 * D3's Name and Phone, in one place.
 *
 * Block F's edit form is specified as "reuse D3's Name and Phone fields", and
 * this is where that reuse lives: the new-customer form wraps these and adds its
 * own third field, the edit form takes them alone. Neither owns the metrics, so
 * the two cannot drift.
 *
 * The fields write into the object they are given rather than replacing it per
 * keystroke: a whole-object read-modify-write drops one of two fields set in the
 * same tick, which is what a browser autofilling a name and a number does.
 */
defineProps<{
  fields: CustomerIdentityFields
  /** `phone` is D3's 48px door; `md` the laptop dialog's. */
  size?: 'phone' | 'md'
  /**
   * Creating a record wants both; editing one may clear the number, because the
   * wire allows a customer with no phone and `PATCH` takes an explicit null.
   */
  phoneRequired?: boolean
}>()

const emit = defineEmits<{ phoneLeft: [] }>()

const nameField = ref<InstanceType<typeof SInput> | null>(null)
defineExpose({ focus: () => nameField.value?.focus() })
</script>

<template>
  <SInput
    ref="nameField"
    v-model="fields.name"
    label="Name"
    :size="size ?? 'phone'"
    label-size="md"
    required
  />
  <!-- `focusout`, not `blur`: the listener lands on SInput's wrapper and blur
       does not bubble to it. Leaving the number is when it is worth checking. -->
  <SInput
    v-model="fields.phone"
    label="Phone"
    :size="size ?? 'phone'"
    label-size="md"
    type="tel"
    mono
    :required="phoneRequired"
    @focusout="emit('phoneLeft')"
  />
</template>
