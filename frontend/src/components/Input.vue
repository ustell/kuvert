<template>
  <input
    :value="modelValue"
    @input="onInput"
    v-bind="$attrs"
    :class="baseClass + ' ' + ($attrs.class ?? '')"
  />
</template>

<script setup lang="ts">
defineProps<{ modelValue?: string }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
}>();

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  emit('update:modelValue', v);
}

const baseClass =
  'h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/5';
</script>

<style scoped>
/* minimal, visual is driven by baseClass */
</style>
