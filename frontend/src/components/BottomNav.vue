<template>
  <nav v-if="auth.isAutorizited" class="bottom-nav">
    <RouterLink to="/" class="tab" :class="{ active: is('/') }">
      <div class="ic">🏠</div>
      <div>Главная</div>
    </RouterLink>

    <RouterLink to="/accept" class="tab" :class="{ active: is('/accept') }">
      <div class="ic">🔁</div>
      <div>Принять</div>
    </RouterLink>

    <RouterLink to="/create" class="tab" :class="{ active: is('/create') }">
      <div class="ic">➕</div>
      <div>Создать</div>
    </RouterLink>

    <RouterLink v-if="isAdmin" to="/admin" class="tab" :class="{ active: is('/admin') }">
      <div class="ic">⚙️</div>
      <div>Admin</div>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from '../stores/auth';

const route = useRoute();
const auth = useAuth();

// Подсветка активной вкладки: учитываем вложенные пути (/admin/users)
const is = (p: string) => route.path === p || route.path.startsWith(p + '/');

// Признак админа — по имени роли (в твоих данных roleId — UUID)
const isAdmin = computed(() => {
  const name = auth.users?.role?.name;
  return typeof name === 'string' && name.toLowerCase() === 'admin';
});
</script>
