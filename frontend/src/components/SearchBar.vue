<script setup lang="ts">
import Input from './Input.vue';
import { watch } from 'vue';
import { useDebouncedRef } from '../composables/useDebouncedRef';

const props = defineProps({
  raw: { type: String, default: '' },
  debounced: { type: String, default: '' },
  placeholder: { type: String, default: 'Поиск...' },
  debounceMs: { type: Number, default: 250 },
});

const emit = defineEmits(['update:raw', 'update:debounced']);

const { raw: localRaw, debounced: localDebounced } = useDebouncedRef(
  props.raw ?? '',
  props.debounceMs,
);

// sync local -> parent
watch(localRaw, (v) => emit('update:raw', v));
watch(localDebounced, (v) => emit('update:debounced', v));

// sync parent -> local (in case parent updates externally)
watch(
  () => props.raw,
  (v) => {
    if (v !== localRaw.value) localRaw.value = v ?? '';
  },
);
watch(
  () => props.debounced,
  (v) => {
    if (v !== localDebounced.value) localDebounced.value = v ?? '';
  },
);
</script>

<template>
  <Input v-model="localRaw" :placeholder="placeholder" />
</template>

<style scoped>
/* small wrapper - no additional styles */
</style>
