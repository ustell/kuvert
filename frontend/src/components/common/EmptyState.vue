<script setup lang="ts">
defineProps<{ text?: string }>();
</script>

<template>
  <div class="py-8 text-center text-sm text-gray-500">
    {{ text || 'Пусто' }}
  </div>
</template>
