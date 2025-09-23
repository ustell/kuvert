<template>
  <div class="list-item">
    <div class="row" style="gap:8px;align-items:center">
      <div class="icon">⬢</div>
      <div>{{ name }}</div>
    </div>
    <span class="badge">{{ units }} units</span>
  </div>
</template>
<script setup>
defineProps({ name: String, units: Number })
</script>
<style>
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
</style>