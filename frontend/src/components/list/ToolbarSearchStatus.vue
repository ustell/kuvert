<script setup lang="ts">
type Status = 'all' | 'pending' | 'accepted' | 'rejected';
const { modelValue, status, disabled } = defineProps<{
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
import Input from '../Input.vue';
</script>

<template>
  <div class="flex flex-col items-stretch gap-2 mt-2">
    <Input
      :modelValue="modelValue"
      @update:modelValue="(v) => emit('update:modelValue', v)"
      placeholder="Поиск…"
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
