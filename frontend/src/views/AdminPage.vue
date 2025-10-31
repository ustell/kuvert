<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';
import {Users, Package, ArrowRight} from 'lucide-vue-next';

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
      <button class="tab" :class="{ active: tab === 'users' }" @click="tab = 'users'"><Users :size="16" color="#333333" /></button>
      <button class="tab" :class="{ active: tab === 'goods' }" @click="tab = 'goods'"><Package :size="16" color="#333333" /></button>
      <button class="tab" :class="{ active: tab === 'transfer' }" @click="tab = 'transfer'"><ArrowRight :size="16" color="#333333" /></button>
    </div>

    <Suspense>
      <template #default>
        <component
          :is="tab === 'users' ? AdminUsers : tab === 'goods' ? AdminGoods : AdminTransfer"
          class=""
        />
      </template>
      <template #fallback>
        <div class="space-y-2 ">
          <div v-for="i in 6" :key="i" class="h-14 animate-pulse rounded-md bg-gray-100" />
        </div>
      </template>
    </Suspense>
  </div>
</template>

 
