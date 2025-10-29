<script setup lang="ts">
type Status = 'all' | 'pending' | 'accepted' | 'rejected';
const props = defineProps<{
  modelValue: string; // поиск
  status: Status; // текущий статус
  disabled?: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'update:status', v: Status): void;
  (e: 'refresh'): void;
}>();
import Button from '../Button.vue';
</script>

<template>
  <div class="flex flex-col items-stretch gap-2">
    <input
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text"
      placeholder="Поиск…"
      class="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/5"
    />
    <select
      :value="status"
      @change="emit('update:status', ($event.target as HTMLSelectElement).value as any)"
      class="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
    >
      <option value="all">Все статусы</option>
      <option value="pending">В ожидании</option>
      <option value="accepted">Подтверждено</option>
      <option value="rejected">Отклонено</option>
    </select>
    <Button variant="primary" :disabled="disabled" aria-label="Обновить" @click="emit('refresh')">
      Обновить
    </Button>
  </div>
</template>
