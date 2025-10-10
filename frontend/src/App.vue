<script setup lang="ts">
import { RouterView } from 'vue-router';
import BottomNav from './components/BottomNav.vue';
import './style.css';
// import { useAuth } from './stores/auth';
// import { onMounted } from 'vue';

// const auth = useAuth();

// console.log('login');
// onMounted(auth.me);
</script>

<template>
  <main class="container">
    <RouterView />
  </main>
  <BottomNav />
</template>

<style></style>
