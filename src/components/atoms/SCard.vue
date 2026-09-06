<script setup lang="ts">
defineProps<{
  variant?: 'record' | 'figure' | 'attention'
  microLabel?: string
  title?: string
  figure?: string
  figureCaption?: string
  body?: string
}>()
</script>

<template>
  <div class="s-card" :class="`s-card--${variant ?? 'record'}`">
    <!-- Figure card: dark bg, large mono number -->
    <template v-if="variant === 'figure'">
      <span v-if="microLabel" class="s-card-micro s-card-micro--dark">{{ microLabel }}</span>
      <span class="s-card-figure">{{ figure }}</span>
      <span v-if="figureCaption" class="s-card-figure-caption">{{ figureCaption }}</span>
      <slot />
    </template>

    <!-- Attention card: risk left border -->
    <template v-else-if="variant === 'attention'">
      <span v-if="microLabel" class="s-card-micro s-card-micro--risk">{{ microLabel }}</span>
      <p v-if="title" class="s-card-title">{{ title }}</p>
      <p v-if="body" class="s-card-body">{{ body }}</p>
      <slot />
    </template>

    <!-- Record card: default -->
    <template v-else>
      <span v-if="microLabel" class="s-card-micro">{{ microLabel }}</span>
      <p v-if="title" class="s-card-title">{{ title }}</p>
      <p v-if="body" class="s-card-body">{{ body }}</p>
      <slot />
    </template>
  </div>
</template>

<style scoped>
.s-card {
  border-radius: var(--radius-card);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.s-card--record {
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  box-shadow: var(--shadow-elev-1);
}

.s-card--figure {
  background: var(--color-fg);
  border: 1px solid var(--color-fg);
  box-shadow: var(--shadow-elev-1);
}

.s-card--attention {
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-left: 3px solid var(--color-risk);
  box-shadow: var(--shadow-elev-1);
}

.s-card-micro {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-fg-2);
}

.s-card-micro--dark {
  color: var(--color-muted-dark);
}

.s-card-micro--risk {
  color: var(--color-risk);
}

.s-card-figure {
  font-family: var(--font-mono);
  font-size: 30px;
  font-weight: 500;
  color: var(--color-inverse);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.s-card-figure-caption {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-very-muted-dark);
}

.s-card-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-fg);
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.s-card-body {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-fg-2);
  margin: 0;
  line-height: 1.5;
}
</style>
