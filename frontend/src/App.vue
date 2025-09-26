<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import BottomNav from './components/BottomNav.vue';
import './style.css';
import { useAuth } from './stores/auth';
import { onMounted } from 'vue';
import { useItem } from './stores/item';
import { useUsers } from './stores/user';

const auth = useAuth()

onMounted(auth.me)
</script>

<template>
  <main class="container">
    <RouterView />
  </main>
  <BottomNav />
</template>

<style></style>
