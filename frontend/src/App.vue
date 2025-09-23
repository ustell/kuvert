<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import BottomNav from './components/BottomNav.vue';
import './style.css';
</script>

<template>
  <main class="container">
    <RouterView />
  </main>
  <BottomNav />
</template>

<style></style>
