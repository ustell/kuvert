<script setup lang="ts">
import { computed } from 'vue';
import { useTrans } from '../stores/transfer';
import { useItem } from '../stores/item';
import { useAuth } from '../stores/auth';

const trans = useTrans();
const items = useItem();
const auth = useAuth();

const active = computed(() => {
  // any global loading or creating or busy transfer
  const tBusy = trans.busy ? (trans.busy as Set<any>).size > 0 : false;
  return !!(trans.loading || trans.creating || tBusy || items.loading || auth.loading);
});
</script>

<template>
  <div v-if="active" class="global-progress" aria-hidden="true">
    <div class="bar" />
  </div>
</template>

<style scoped>
.global-progress {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  z-index: 1200;
  pointer-events: none;
}
.global-progress .bar {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #60a5fa);
  animation: prog 1.2s linear infinite;
  transform-origin: left center;
}
@keyframes prog {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
