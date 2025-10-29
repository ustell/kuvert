<script setup lang="ts">
import { useNotify } from '../stores/notify';
const notify = useNotify();
</script>

<template>
  <div class="toast-wrap">
    <div
      v-for="t in notify.toasts"
      :key="t.id"
      class="toast"
      :class="`toast--${t.kind}`"
      @click="notify.remove(t.id)"
      role="status"
      aria-live="polite"
    >
      {{ t.text }}
    </div>
  </div>
</template>

<style scoped>
.toast-wrap {
  position: fixed;
  right: 14px;
  bottom: 14px;
  display: grid;
  gap: 8px;
  z-index: 1100;
}
.toast {
  min-width: 240px;
  max-width: 360px;
  padding: 10px 12px;
  border-radius: 10px;
  color: #111;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}
.toast--success {
  border-color: #86efac;
  background: #f0fdf4;
}
.toast--error {
  border-color: #fecaca;
  background: #fef2f2;
}
.toast--info {
  border-color: #bae6fd;
  background: #eff6ff;
}
</style>
