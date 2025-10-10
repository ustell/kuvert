<template>
  <span class="badge" :class="kind"><slot /></span>
</template>

<script setup lang="ts">
defineProps<{ kind?: "pending" | "success" | "muted" }>();
</script>
