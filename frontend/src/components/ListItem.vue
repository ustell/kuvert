<template>
  <div class="list-item" :class="{ clickable }" @click="$emit('click')">
    <div class="li-left">
      <slot name="left">
        <div class="icon">📦</div>
      </slot>
      <div class="li-body">
        <div class="li-title"><slot /></div>
        <div class="li-sub"><slot name="sub" /></div>
      </div>
    </div>
    <div class="li-right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ clickable?: boolean }>();
</script>
