<template>
  <span class="bdg" :class="kind"><slot /></span>
</template>
<script setup lang="ts">
defineProps<{ kind?: 'muted' | 'pending' | 'success' | 'danger' | 'primary' }>();
</script>
<style scoped>
.bdg {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--line);
  background: #fff;
}
.muted {
  color: var(--muted);
}
.primary {
  border-color: #c7d7ff;
  background: var(--accent-weak);
}
.pending {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}
.success {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: var(--success);
}
.danger {
  border-color: #fecaca;
  background: #fff1f2;
  color: var(--danger);
}
</style>
