<script setup lang="ts">
// Placeholder — the catalogue list is built in tasks 8 (laptop frame), 9 (phone frame)
// and 10 (responsive composition) of plan.md. Task 0 registers the route so the rest
// of the scaffolding can be wired and verified.
import { SText } from '@/components/atoms'
</script>

<template>
  <main class="catalogue-placeholder">
    <SText type="title" as="h1">Catalogue list</SText>
    <SText type="body">Not built yet — see <code>plan.md</code>, tasks 8&ndash;10.</SText>
  </main>
</template>

<style scoped>
.catalogue-placeholder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 48px;
}
</style>
