<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'display' | 'title' | 'heading' | 'body' | 'ui' | 'meta' | 'label' | 'micro' | 'money-lg' | 'money'
  color?: 'fg' | 'fg-2' | 'fg-3' | 'action' | 'risk' | 'inverse' | 'muted-dark'
  as?: string
}>()

const BLOCK_TYPES = new Set(['display', 'title', 'heading', 'body', 'meta', 'label'])

const tag = computed(() => props.as ?? (BLOCK_TYPES.has(props.type ?? 'body') ? 'p' : 'span'))
</script>

<template>
  <component
    :is="tag"
    class="s-text"
    :class="[`s-text--${type ?? 'body'}`, color && `s-text--color-${color}`]"
  >
    <slot />
  </component>
</template>

<style scoped>
.s-text {
  margin: 0;
}

/* === Type roles === */
.s-text--display {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--color-fg);
}

.s-text--title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-fg);
}

.s-text--heading {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-fg);
}

.s-text--body {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-fg);
}

.s-text--ui {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-fg);
}

.s-text--meta {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-fg-2);
}

.s-text--label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--color-fg-2);
}

.s-text--micro {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-fg-2);
}

.s-text--money-lg {
  font-family: var(--font-mono);
  font-size: 30px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  color: var(--color-fg);
}

.s-text--money {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--color-fg);
}

/* === Color overrides === */
.s-text--color-fg       { color: var(--color-fg); }
.s-text--color-fg-2     { color: var(--color-fg-2); }
.s-text--color-fg-3     { color: var(--color-fg-3); }
.s-text--color-action   { color: var(--color-action); }
.s-text--color-risk     { color: var(--color-risk); }
.s-text--color-inverse  { color: var(--color-inverse); }
.s-text--color-muted-dark { color: var(--color-muted-dark); }
</style>
