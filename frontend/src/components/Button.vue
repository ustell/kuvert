<template>
  <button class="btn" :class="[variant, { full }]" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: "primary" | "danger" | "ghost" | "soft";
  full?: boolean;
}>();
</script>
