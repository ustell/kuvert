<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';

const tab = ref<'users' | 'goods' | 'transfer'>('users');

const AdminUsers = defineAsyncComponent({
  loader: () => import('./admin/AdminUsers.vue'),
  timeout: 0,
});
const AdminGoods = defineAsyncComponent({
  loader: () => import('./admin/AdminGoods.vue'),
  timeout: 0,
});
const AdminTransfer = defineAsyncComponent({
  loader: () => import('./admin/AdminTransfer.vue'),
  timeout: 0,
});
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div class="title-18">Настрокйи администратора</div>
      <div class="">Управляйте пользователями и товарами</div>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'users' }" @click="tab = 'users'">👥</button>
      <button class="tab" :class="{ active: tab === 'goods' }" @click="tab = 'goods'">📦</button>
      <button class="tab" :class="{ active: tab === 'transfer' }" @click="tab = 'transfer'">
        🔁
      </button>
    </div>

    <Suspense>
      <template #default>
        <component
          :is="tab === 'users' ? AdminUsers : tab === 'goods' ? AdminGoods : AdminTransfer"
          class="mt12"
        />
      </template>
      <template #fallback>
        <div class="space-y-2 mt12">
          <div v-for="i in 6" :key="i" class="h-14 animate-pulse rounded-md bg-gray-100" />
        </div>
      </template>
    </Suspense>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  background: #f3f4f7;
  border: 1px solid var(--line);
  padding: 6px;
  border-radius: 999px;
  margin-top: 12px;
}
.tab {
  flex: 1;
  appearance: none;
  border: none;
  background: transparent;
  padding: 10px 12px;
  border-radius: 999px;
  font-weight: 700;
  color: #2a2f3a;
  cursor: pointer;
}
.tab.active {
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
}
.mt12 {
  margin-top: 12px;
}
.space-y-2 > * + * {
  margin-top: 0.5rem;
}
.h-14 {
  height: 3.5rem;
}
.animate-pulse {
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.65;
  }
  50% {
    opacity: 1;
  }
}
</style>
