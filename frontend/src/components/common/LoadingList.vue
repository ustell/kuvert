<script setup lang="ts">
const props = defineProps<{ rows?: number }>();
</script>

<template>
  <div class="skeleton-list mt-4" :aria-busy="true" role="status">
    <div v-for="i in props.rows ?? 6" :key="i" class="s-item">
      <div class="s-avatar" aria-hidden="true"></div>
      <div class="s-lines">
        <div class="s-line s-line-main" aria-hidden="true"></div>
        <div class="s-line s-line-sub" aria-hidden="true"></div>
      </div>
      <div class="s-meta" aria-hidden="true"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.s-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.03) inset;
}
.s-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f3f4f6, #eaeef2, #f3f4f6);
  background-size: 200% 100%;
  animation: pulse 1.2s linear infinite;
}
.s-lines {
  flex: 1;
}
.s-line {
  height: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
  background: linear-gradient(90deg, #f3f4f6, #eaeef2, #f3f4f6);
  background-size: 200% 100%;
  animation: pulse 1.2s linear infinite;
}
.s-line-main {
  width: 70%;
  height: 12px;
}
.s-line-sub {
  width: 40%;
  height: 10px;
}
.s-meta {
  width: 48px;
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6, #eaeef2, #f3f4f6);
  background-size: 200% 100%;
  animation: pulse 1.2s linear infinite;
}

@keyframes pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
