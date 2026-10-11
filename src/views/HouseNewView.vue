<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { createHouse } from '@/api/customers'
import { customerKeys, useCustomer } from '@/api/hooks/customers'
import { SBanner, SButton, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import HouseFormFields from '@/components/house/HouseFormFields.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useSaveReporter } from '@/composables/useSaveState'
import { blankHouseDraft, isHouseDraftEmpty, parseGps } from '@/types/house'

/**
 * `/customers/{id}/houses/new` — a house she does not have yet.
 *
 * A screen rather than a dialog: this is ten fields answering four questions,
 * and it is filled standing in her compound or straight after. Its own address,
 * so the back gesture closes the form rather than leaving her page — and no id
 * in that address, because `POST /customers/{id}/houses` mints one when it is
 * saved, not when the button was pressed.
 */
const props = defineProps<{ customerId: number }>()

const router = useRouter()
const queryClient = useQueryClient()
const isPhone = useMediaQuery('(max-width: 899px)')

/** Her name, so the form says whose house this is. A failure costs the name. */
const customerQuery = useCustomer(() => props.customerId)
const customerName = computed(() => customerQuery.data.value?.name ?? 'This customer')

const draft = reactive(blankHouseDraft())
const saving = ref(false)
const error = ref('')

const save = useSaveReporter()

/**
 * Nothing is required, so the only thing refused is a house that says nothing —
 * and coordinates that are not coordinates, which would otherwise be dropped on
 * the way out without him ever being told.
 */
const saveable = computed(
  () => !isHouseDraftEmpty(draft) && parseGps(draft.gps) !== 'invalid' && !saving.value,
)

const back = () => router.push({ name: 'customer-detail', params: { id: props.customerId } })

async function submit() {
  if (!saveable.value) return

  saving.value = true
  error.value = ''
  save.saving()
  try {
    await createHouse(props.customerId, draft)
    save.saved()
    // Her page is where the new house appears, so its list must re-read.
    await queryClient.invalidateQueries({ queryKey: customerKeys.houses(props.customerId) })
    back()
  } catch (caught) {
    // The form holds everything he typed: nothing was created, so he can retry.
    error.value = caught instanceof Error ? caught.message : 'Could not start the house.'
    save.failed()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="screen">
      <div class="head">
        <button type="button" class="crumb" @click="back">
          <SText type="cell-meta">‹ {{ customerName }}</SText>
        </button>
        <SText type="display" as="h1">A new house</SText>
        <SText type="row-meta" color="fg-2-soft">
          Nothing here is required. What is known today is what the visit turned up.
        </SText>
      </div>

      <SBanner v-if="error" variant="error" class="failure">{{ error }}</SBanner>

      <div class="body">
        <HouseFormFields
          :draft="draft"
          :size="isPhone ? 'phone' : 'md'"
          :disabled="saving"
        />
      </div>

      <div class="actions">
        <SButton
          :size="isPhone ? 'phone-wide' : 'md'"
          :disabled="!saveable"
          :loading="saving"
          @click="submit"
        >
          Save the house
        </SButton>
        <SButton
          variant="ghost"
          :size="isPhone ? 'phone-ghost' : 'md'"
          :disabled="saving"
          @click="back"
        >
          Cancel
        </SButton>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
}

.head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 28px 32px 0;
}

/* As tall as its own text, not as the document's line box. */
.crumb {
  display: inline-flex;
  align-items: center;
  padding: 0;
  background: none;
  border: none;
  border-radius: var(--radius-flag);
  cursor: pointer;
  font: inherit;
}

.crumb:hover :deep(.s-text) {
  color: var(--color-fg-2);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.crumb:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

/* A form is read down one column — a second one would have him scanning for
   where it continues. Held to a measure so the prose fields stay readable. */
.body {
  max-width: 680px;
  padding: 28px 32px;
}

.failure {
  margin: 20px 32px 0;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 32px 24px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
}

/* ⚠️ Not designed. The phone takes the same single column with the frame's
   padding pulled in, and the two doors stand at their phone sizes. */
@media (max-width: 899px) {
  .head {
    padding: 20px 16px 0;
  }

  .body {
    padding: 20px 16px;
  }

  .failure {
    margin: 16px 16px 0;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }
}
</style>
