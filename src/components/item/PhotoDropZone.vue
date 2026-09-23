<script setup lang="ts">
import { ref } from 'vue'
import { SText } from '@/components/atoms'

const props = defineProps<{
  /** A local object URL once he has dropped something. */
  photoUrl: string | null
  label?: string
  /** Locked: it takes neither a click nor a drop, and says so by receding. */
  disabled?: boolean
}>()

const emit = defineEmits<{ select: [file: File] }>()

/**
 * Drag-over is the one place on this screen where a border changes to solid
 * `--action`: the zone is saying it will take what is over it.
 */
const over = ref(false)

const fileEl = ref<HTMLInputElement | null>(null)

function onDrop(event: DragEvent) {
  over.value = false
  if (props.disabled) return
  const file = event.dataTransfer?.files?.[0]
  if (file) emit('select', file)
}

function onPick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('select', file)
}
</script>

<template>
  <div class="group">
    <SText
      v-if="label"
      type="label"
      as="label"
      class="label"
      :class="{ 'label--locked': disabled }"
      @click="!disabled && fileEl?.click()"
    >
      {{ label }}
    </SText>

    <!-- A drop zone that only takes drops is unusable by keyboard, so it is a
         button that also takes them. -->
    <button
      type="button"
      class="zone"
      :disabled="disabled"
      :class="{ 'zone--over': over && !disabled, 'zone--filled': photoUrl }"
      @click="fileEl?.click()"
      @dragover.prevent="over = !disabled"
      @dragenter.prevent="over = !disabled"
      @dragleave="over = false"
      @drop.prevent="onDrop"
    >
      <img v-if="photoUrl" :src="photoUrl" alt="" class="photo" />
      <SText v-else type="hint" color="fg-2-soft" class="prompt">
        drop a product<br />photo here
      </SText>
    </button>

    <input ref="fileEl" type="file" accept="image/*" class="file" @change="onPick" />
  </div>
</template>

<style scoped>
.group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  cursor: pointer;
}

.label--locked {
  cursor: default;
}

.zone {
  height: 118px;
  padding: 8px;
  display: grid;
  place-items: center;
  text-align: center;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  /* The stripe says "nothing here yet" without drawing an icon that would then
     have to mean something. */
  background: repeating-linear-gradient(
    135deg,
    var(--color-surface) 0 6px,
    var(--color-chrome) 6px 12px
  );
  cursor: pointer;
  overflow: hidden;
  transition: border-color 120ms ease-out, background-color 120ms ease-out;
}

.zone:hover:not(.zone--over):not(:disabled) {
  border-color: var(--color-fg-3);
}

/* Locked. The stripe is already the quietest surface on the screen, so it needs
   nothing added — it just stops answering. */
.zone:disabled {
  cursor: not-allowed;
}

.zone:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

/* Solid action, because it is about to accept — the one moment a dashed-or-quiet
   border on this screen goes solid and blue. */
.zone--over {
  border: 1px solid var(--color-action);
  background: var(--color-row-action-tint);
}

/* A photo needs no stripe behind it. */
.zone--filled {
  background: var(--color-surface);
  padding: 0;
}

.photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.prompt {
  line-height: 1.5;
}

.file {
  display: none;
}
</style>
