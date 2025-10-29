<script setup lang="ts">
import { RouterView } from 'vue-router';
import BottomNav from './components/BottomNav.vue';
import Toaster from './components/ToastHost.vue';
import './style.css';
</script>

<template>
  <main class="container">
    <RouterView />
    <Toaster />
  </main>
  <BottomNav />
</template>

<style></style>
