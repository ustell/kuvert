<script setup lang="ts">
defineProps<{ rows?: number }>();
</script>

<template>
  <div class="space-y-2 mt-4">
    <div v-for="i in rows ?? 6" :key="i" class="h-14 animate-pulse rounded-md bg-gray-100" />
  </div>
</template>

<style scoped>
.space-y-2 > * + * {
  margin-top: 0.5rem;
}
.h-14 {
  height: 3.5rem;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.65;
  }
  50% {
    opacity: 1;
  }
}
.animate-pulse {
  animation: pulse 1.2s ease-in-out infinite;
}
</style>
