<script setup lang="ts">
import { computed } from 'vue'
import { SBadge, SButton, SText } from '@/components/atoms'
import { HEADING_ID } from '@/types/customerDetail'
import {
  CONTACT_KIND_LABEL,
  phoneDigits,
  STATUS_BADGE,
  type CustomerStatus,
  type LoggedContact,
} from '@/types/customers'

/**
 * Who she is, how to reach her, and the two things he can do about it.
 *
 * Once anonymised the block loses its phone, its WhatsApp link and her name —
 * the name becomes the supplied label — and keeps everything else. The handoff
 * does not draw this screen, only says what goes; nothing else is assumed.
 */
const props = defineProps<{
  name: string
  phone: string
  status: CustomerStatus
  /** Supplied — `last contact 8 d ago`. Reads `today` once one is logged. */
  lastContactPhrase: string
  /** The contact logged in this visit, if there is one. */
  logged: LoggedContact | null
  anonymised: boolean
  /** `Customer #0141` — what stands where her name was. */
  anonymousLabel: string
  /** `30 Sep` — the date on the chip beside it. */
  anonymisedOn: string
}>()

/** The press goes with `edit`: the button is what focus comes back to. */
defineEmits<{ spoke: []; edit: [event: MouseEvent] }>()

const heading = computed(() => (props.anonymised ? props.anonymousLabel : props.name))

/** The status the log answered with, if it answered with one. Nothing here decides it. */
const status = computed(() => props.logged?.result?.status ?? props.status)

/**
 * `wa.me` wants the number in full international form, and the record carries it
 * as it is dialled locally — `024 318 6620`. The digits go as stored; a leading
 * `0` is a national trunk prefix that only a country code can replace, and this
 * screen is not the place to decide she is in Ghana.
 */
const whatsapp = computed(() => `https://wa.me/${phoneDigits(props.phone)}`)
</script>

<template>
  <div class="identity">
    <!-- Back to the list she was found in. It keeps its filter and its search. -->
    <RouterLink :to="{ name: 'customers' }" class="crumb">
      <SText type="cell-meta">Customers ›</SText>
    </RouterLink>

    <div class="name-row">
      <SText :id="HEADING_ID" type="display" as="h1" tabindex="-1" class="heading">
        {{ heading }}
      </SText>
      <SBadge v-if="anonymised" variant="category-mid" size="status">
        anonymised {{ anonymisedOn }}
      </SBadge>
      <SBadge :variant="STATUS_BADGE[status]" size="state">{{ status }}</SBadge>
    </div>

    <div class="contact-row">
      <!-- Gone with her name: there is no number left to show or to open. -->
      <template v-if="!anonymised">
        <SText type="list-figure">{{ phone || 'no number' }}</SText>
        <a
          v-if="phone"
          :href="whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          class="link"
        >
          <SText type="cell" color="action-ink">Open WhatsApp</SText>
        </a>
      </template>
      <SText type="list-meta">
        {{ logged ? 'last contact today' : lastContactPhrase }}
      </SText>
    </div>

    <div class="actions">
            <SText v-if="logged" type="list-meta" color="action-ink" class="stamp">
        ✓ {{ CONTACT_KIND_LABEL[logged.kind] }} · {{ logged.time }}
      </SText>
      <SButton v-else size="toolbar" @click="$emit('spoke')">Spoke today</SButton>

      <!-- `PATCH /customers/{id}` rejects an anonymised customer, and there is
           nothing left to correct. Spoke today stays: she can still be rung. -->
      <SButton
        v-if="!anonymised"
        variant="chrome"
        size="toolbar"
        @click="$emit('edit', $event)"
      >
        Edit details
      </SButton>
    </div>
  </div>
</template>

<style scoped>
.identity {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* A link that is a way back, not a word in a sentence: no rule under it until
   it is reached for. */
.crumb,
.link {
  /* A flex box rather than an inline one, so it stands exactly as tall as the
     text inside it. An inline `<a>` takes its line box from its own font size —
     the document's — and a 11px crumb inside one would reserve 15px of room. */
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  align-self: flex-start;
  border-radius: var(--radius-flag);
}

.crumb:hover :deep(.s-text),
.link:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.crumb:hover :deep(.s-text) {
  color: var(--color-fg-2);
}

.crumb:focus-visible,
.link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

/* Focusable so the screen can put him on the name when it changes under him, and
   only then does it show a ring — a heading is not a control. */
.heading:focus {
  outline: none;
}

.heading:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 4px;
  border-radius: var(--radius-flag);
}

.name-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 6px;
  flex-wrap: wrap;
}

.stamp {
  white-space: nowrap;
}

/*
 * ⚠️ Not designed. Below ~900px the drawn boxes stay as they are and the targets
 * around them grow to the phone minimum: the buttons stand at `--hit-min`, and
 * each link keeps its 11–14px text and gains an invisible target centred on it.
 */
@media (max-width: 899px) {
  .actions .s-btn {
    min-height: var(--hit-min);
  }

  .crumb,
  .link {
    position: relative;
  }

  .crumb::after,
  .link::after {
    content: '';
    position: absolute;
    inset: 50% auto auto 50%;
    width: 100%;
    min-width: var(--hit-min);
    height: var(--hit-min);
    transform: translate(-50%, -50%);
  }
}
</style>
