<template>
  <button class="ib" :class="variant"><slot /></button>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'ghost' | 'danger' }>(), { variant: 'ghost' });
</script>
<style scoped>
.ib {
  appearance: none;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
}
.ib.danger {
  background: #fff5f5;
  border-color: #ffd7d7;
  color: #c02626;
}
</style>
