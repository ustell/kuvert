<script setup lang="ts">
import Modal from './Modal.vue';
import Button from '../Button.vue';
import Input from '../Input.vue';
import { watch, computed } from 'vue';
import type { User } from '../../types/domain';
import type { UserDTO } from '../../types/DTO';
import { useUserForm } from '../../composables/useUserForm';

type Role = { id: string; name: string };

const { modelValue, title, currentUser, roles } = defineProps<{
  modelValue: boolean;
  title: string;
  currentUser: User | null;
  roles?: Role[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'create', v: Pick<UserDTO, 'name' | 'phone' | 'password' | 'roleId'>): void;
  (e: 'update', v: Pick<UserDTO, 'id' | 'name' | 'phone' | 'password' | 'roleId'>): void;
}>();

const open = computed({ get: () => modelValue, set: (v: boolean) => emit('update:modelValue', v) });

const {
  local,
  state,
  canSubmit,
  fillErrors,
  markTouched,
  resetForm,
  toCreateDto,
  toUpdateDto,
  hasErr,
} = useUserForm();

watch(
  () => currentUser,
  (u) => resetForm(u, roles),
  { immediate: true },
);

watch(open, (v) => {
  if (v) resetForm(currentUser, roles);
});

function onCreate() {
  markTouched();
  if (!fillErrors(!!currentUser)) return;
  emit('create', toCreateDto());
  emit('update:modelValue', false);
}

function onUpdate() {
  markTouched();
  if (!fillErrors(!!currentUser)) return;
  emit('update', toUpdateDto());
  emit('update:modelValue', false);
}
</script>

<template>
  <Modal v-model="open" :title="title">
    <div class="form">
      <label class="field" :class="{ invalid: hasErr('name') }">
        <span class="lbl">Имя</span>
        <Input
          placeholder="Иван Иванов"
          :modelValue="local.name"
          @update:modelValue="(v) => (local.name = v)"
          @blur="
            markTouched('name');
            fillErrors(!!currentUser);
          "
          aria-describedby="err-name"
          autofocus
        />
        <span v-if="hasErr('name')" id="err-name" class="err">{{ state.errors.name }}</span>
      </label>

      <label class="field" :class="{ invalid: hasErr('phone') }">
        <span class="lbl">Номер телефона</span>
        <Input
          placeholder="+7777777777"
          :modelValue="local.phone"
          @update:modelValue="(v) => (local.phone = v)"
          @blur="
            markTouched('phone');
            fillErrors(!!currentUser);
          "
          aria-describedby="err-phone"
        />
        <span v-if="hasErr('phone')" id="err-phone" class="err">{{ state.errors.phone }}</span>
      </label>

      <label class="field" :class="{ invalid: hasErr('password') }">
        <span class="lbl">Пароль</span>
        <Input
          type="password"
          placeholder="***********"
          :modelValue="local.password"
          @update:modelValue="(v) => (local.password = v)"
          @blur="
            markTouched('password');
            fillErrors(!!currentUser);
          "
          aria-describedby="err-pass"
        />
        <span v-if="hasErr('password')" id="err-pass" class="err">{{ state.errors.password }}</span>
        <span v-if="currentUser" class="hint">Можно оставить пустым, чтобы не менять пароль</span>
      </label>

      <label class="field" :class="{ invalid: hasErr('roleId') }">
        <span class="lbl">Роль</span>
        <select
          v-model="local.roleId"
          @blur="
            markTouched('roleId');
            fillErrors(!!currentUser);
          "
          :disabled="!roles?.length"
          :aria-invalid="!!state.errors.roleId"
          aria-describedby="err-role"
          class="select"
        >
          <option v-if="!roles?.length" value="">Роли не загружены</option>
          <option v-else value="">— Выберите роль —</option>
          <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
        <span v-if="hasErr('roleId')" id="err-role" class="err">{{ state.errors.roleId }}</span>
      </label>
    </div>

    <template #footer>
      <div class="footer">
        <Button variant="soft" class="" @click="emit('update:modelValue', false)"
          >Отменить</Button
        >
        <Button
          variant="primary"
          class=""
          :disabled="!canSubmit"
          @click="currentUser ? onUpdate() : onCreate()"
        >
          {{ currentUser ? '＋ Редактировать' : '＋ Создать' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.form {
  display: grid;
  gap: 14px;
}
.field {
  display: grid;
  gap: 6px;
}
.lbl {
  font-size: 14px;
  font-weight: 600;
  color: #000;
}
.field input,
.select {
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 10px 12px;
  border-radius: 10px;
  outline: none;
}
.select {
  height: 40px;
}
.field.invalid input,
.field.invalid .select {
  border-color: #fecaca !important;
  background: #fff1f2 !important;
}
.err {
  color: #b91c1c;
  font-size: 12px;
}
.hint {
  color: #6b7280;
  font-size: 12px;
}
.footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
