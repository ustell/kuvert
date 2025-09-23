<template>
  <div class="card">
    <div class="h1">{{ title }}</div>
    <div class="row" style="gap:12px;align-items:center">
      <div style="font-size:26px">📦</div>
      <div>
        <div class="kpi-num">{{ value }}</div>
        <div class="kpi-sub">{{ subtitle }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({ title: String, value: [String, Number], subtitle: String })
</script>
