<template>
  <div class="list-item">
    <div class="space">
      <div class="row" style="gap:8px;align-items:center">
        <span class="small">From:</span>
        <strong>{{ from }}</strong>
        <span class="badge pending" v-if="status">{{ status }}</span>
      </div>
      <div class="small">{{ details }}</div>
    </div>
    <div class="small">{{ date }}</div>
  </div>
</template>
<script setup>
defineProps({ from: String, status: String, details: String, date: String })
</script>

<style>
.space {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>