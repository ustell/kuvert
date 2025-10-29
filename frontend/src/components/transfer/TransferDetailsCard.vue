<script setup lang="ts">
import Card from '../../components/Card.vue';
import { Options } from '..';
import { SelectItem } from '../ui/select';

const props = defineProps<{
  currentUserName?: string | null;
  allowedTargets: Array<{
    id: string | number;
    name: string;
    role?: { name?: string } | null;
    roleId?: string | number;
  }>;
  modelValue: string | null; // toUserId
  disabled?: boolean;
  touched?: boolean;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string | null): void }>();
</script>

<template>
  <Card padded>
    <div class="card-title">Данные о передаче</div>
    <label class="label mt12">Кому пользователю</label>
    <div class="field">
      <Options
        :model-value="modelValue"
        :disabled="!!disabled"
        @update:model-value="v => emit('update:modelValue', v as string)"
      >
        <SelectItem
          v-for="v in allowedTargets"
          :key="v.id"
          :value="String(v.id)"
          class="px-3 py-2 cursor-pointer"
        >
          <p>
            {{ v.name }} <span>• {{ v.role?.name ?? v.roleId }}</span>
          </p>
        </SelectItem>
      </Options>
    </div>

    <div v-if="touched && !modelValue" class="hint text-red-600 text-sm text-center mt-2">
      Выберите получателя.
    </div>
  </Card>
</template>
