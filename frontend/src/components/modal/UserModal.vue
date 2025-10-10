<script setup lang="ts">
import Modal from './Modal.vue';
import Button from '../Button.vue';
import { computed, reactive, watch } from 'vue';
import type { User } from '../../types/domain';
import type { UserDTO } from '../../types/DTO';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  currentUser: User | null;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'create', v: Pick<UserDTO, 'name' | 'phone' | 'password'>): void;
  (e: 'update', v: Pick<UserDTO, 'name' | 'phone' | 'password' | 'id'>): void;
}>();
const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const local = reactive<Pick<UserDTO, 'name' | 'isActive' | 'password' | 'phone' | 'roleId' | 'id'>>(
  {
    name: '',
    phone: '',
    password: '',
    isActive: true,
    roleId: 1,
    id: '',
  },
);

watch(
  () => props.currentUser,
  (q) => {
    if (q) {
      local.name = q.name;
      local.password = q.password;
      local.phone = q.phone;
      local.id = q.id;
    } else {
      local.name = '';
      local.password = '';
      local.phone = '';
      local.id = '';
    }
  },
  { immediate: true },
);

function create() {
  console.log(local.name, local.phone, local.password);
  if (!local.name || !local.phone || !local.password) {
    return;
  }
  emit('create', { name: local.name, phone: local.phone, password: local.password });
  emit('update:modelValue', false);
}
function update() {
  console.log(local.name, local.phone, local.password);
  if (!local.name || !local.phone || !local.password) {
    return;
  }
  emit('update', { name: local.name, phone: local.phone, password: local.password, id: local.id });
  emit('update:modelValue', false);
}
</script>
<template>
  <Modal v-model="open" :title>
    <div class="form">
      <label class="field">
        <span style="font-size: 14px; font-weight: 600; color: #000">Имя</span>
        <input type="text" placeholder="Иван Иванов" v-model="local.name" />
        <span class="Badge"></span>
      </label>
      <label class="field">
        <span style="font-size: 14px; font-weight: 600; color: #000">Номер телефона</span>
        <input type="text" placeholder="+7777777777" v-model="local.phone" />
        <span class="Badge"></span>
      </label>
      <label class="field">
        <span style="font-size: 14px; font-weight: 600; color: #000">Пароль</span>
        <input type="text" placeholder="***********" v-model="local.password" />
        <span class="Badge"></span>
      </label>
    </div>

    <template #footer>
      <div style="display: flex; gap: 8px; justify-content: flex-end">
        <Button variant="soft" class="mt12">Отменить</Button>
        <Button variant="primary" class="mt12" @click="currentUser ? update() : create()">
          {{ currentUser ? '＋ Редактировать' : '＋ Создать' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
