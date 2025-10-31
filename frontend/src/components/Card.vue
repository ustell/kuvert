<template>
  <section class="card" :class="[{ padded }, variant]">
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ padded?: boolean; variant?: "soft" | "ghost" | "" }>();
</script>
