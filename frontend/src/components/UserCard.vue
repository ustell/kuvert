<template>
  <div class="list-item">
    <div class="row" style="gap:10px">
      <div class="icon">👤</div>
      <div>
        <div class="row" style="gap:8px">
          <strong>{{ name }}</strong>
          <span class="badge" :class="{you: you}">{{ role }}</span>
          <span class="badge you" v-if="you">You</span>
        </div>
        <div class="small">📞 {{ phone }}</div>
      </div>
    </div>
    <div class="row" style="gap:6px">
      <button class="btn small">✎</button>
      <button class="btn small danger">🗑</button>
    </div>
  </div>
</template>
<script setup>
defineProps({ name:String, phone:String, role:String, you:Boolean })
</script>
