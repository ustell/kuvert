<script setup lang="ts">
import { RouterView } from 'vue-router';
import BottomNav from './components/BottomNav.vue';
import Toaster from './components/ToastHost.vue';
import GlobalProgress from './components/GlobalProgress.vue';
import './style.css';
</script>

<template>
  <main class="container">
    <GlobalProgress />
    <RouterView />
    <Toaster />
  </main>
  <BottomNav />
</template>

<style></style>
