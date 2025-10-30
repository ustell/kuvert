<template>
  <nav v-if="auth.isAutorizited" class="bottom-nav">
    <RouterLink  to="/" class="tab" :class="{ active: is('/') }">
      <div class="ic"><House :size="16" color="#333333" /></div>
      <div>Главная</div>
    </RouterLink>

    <RouterLink v-if="!isAdmin" to="/accept" class="tab" :class="{ active: is('/accept') }">
      <div class="ic"><ArrowDownFromLine :size="16" color="#333333" /></div>
      <div>Принять</div>
    </RouterLink>

    <RouterLink v-if="!isAdmin" to="/create" class="tab" :class="{ active: is('/create') }">
      <div class="ic"><ArrowDownToLine :size="16" color="#333333" /></div>
      <div>Создать</div>
    </RouterLink>

    <RouterLink v-if="isAdmin" to="/admin" class="tab" :class="{ active: is('/admin') }">
      <div class="ic"><Settings :size="16" color="#333333" /></div>
      <div>Admin</div>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { 
House,
ArrowDownFromLine,
ArrowDownToLine,
Settings,

 } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from '../stores/auth';

const route = useRoute();
const auth = useAuth();

const is = (p: string) => route.path === p || route.path.startsWith(p + '/');

const isAdmin = computed(() => {
  const name = auth.users?.role?.name;
  return typeof name === 'string' && name.toLowerCase() === 'admin';
});
</script>
