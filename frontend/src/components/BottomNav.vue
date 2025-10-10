<template>
  <nav class="bottom-nav">
    <RouterLink to="/" class="tab" :class="{ active: is('/') }">
      <div class="ic">🏠</div>
      <div>Dashboard</div>
    </RouterLink>
    <RouterLink to="/accept" class="tab" :class="{ active: is('/accept') }">
      <div class="ic">🔁</div>
      <div>Accept</div>
    </RouterLink>
    <RouterLink to="/create" class="tab" :class="{ active: is('/create') }">
      <div class="ic">➕</div>
      <div>Create</div>
    </RouterLink>
    <RouterLink to="/admin" class="tab" :class="{ active: is('/admin') }">
      <div class="ic">⚙️</div>
      <div>Admin</div>
    </RouterLink>
    <RouterLink
      v-if="!auth.isAutorizited"
      to="/login"
      class="tab"
      :class="{ active: is('/login') }"
    >
      <div class="ic">⚙️</div>
      <div>Login</div>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAuth } from '../stores/auth';
const route = useRoute();
const is = (p: string) => route.path === p;

const auth = useAuth();
</script>
