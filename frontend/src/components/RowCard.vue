<script setup lang="ts">
type Meta = { icon?: string; text: string } | string;
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    meta?: Meta[];
    badge?: {
      text: string;
      kind?: 'primary' | 'success' | 'danger' | 'warning' | 'pending';
    };
    pill?: string;
    clickable?: boolean;
  }>(),
  { meta: () => [], clickable: false },
);
</script>

<template>
  <div class="row mt-4 flex-col" :class="{ clickable: clickable }">
    <div class="avatar"><slot name="avatar">🗂</slot></div>

    <div class="main">
      <div class="titleline">
        <div class="title">
          <span class="t">{{ title }}</span>
          <span v-if="badge" class="badge" :class="badge.kind">{{ badge.text }}</span>
        </div>
        <span v-if="pill" class="pill">{{ pill }}</span>
      </div>

      <div v-if="subtitle" class="">{{ subtitle }}</div>

      <div v-if="meta?.length" class="">
        <span v-for="(m, i) in meta" :key="i" class="mi">
          <span v-if="typeof m !== 'string' && m.icon">{{ (m as any).icon }}</span>
          {{ typeof m === 'string' ? m : m.text }}
        </span>
      </div>
    </div>

    <div class="actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
}
.row.clickable {
  cursor: pointer;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #f5f7ff;
  border: 1px solid var(--line);
  flex: 0 0 auto;
}
.main {
  flex: 1 1 auto;
  min-width: 0;
}
.titleline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.title {
  display: flex;
  gap: 8px;
  align-items: center;
}
.t {
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 45vw;
}
.sub {
  color: var(--muted);
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}
.mi {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}
.badge {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
}
.badge.muted {
  color: var(--muted);
}
.badge.primary {
  background: #eef2ff;
  border-color: #c7d7ff;
}
.badge.success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #16a34a;
}
.badge.danger {
  background: #fff1f2;
  border-color: #fecaca;
  color: #b91c1c;
}
.badge.warning,
.badge.pending {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
.pill {
  border: 1px solid var(--line);
  background: #f9fafb;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  white-space: nowrap;
}
.actions {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
}
</style>
