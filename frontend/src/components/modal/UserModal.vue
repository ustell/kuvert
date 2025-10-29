<script setup lang="ts">
import Modal from './Modal.vue';
import Button from '../Button.vue';
import { computed, reactive, watch } from 'vue';
import type { User } from '../../types/domain';
import type { UserDTO } from '../../types/DTO';

type Role = { id: string; name: string };

const props = defineProps<{
  modelValue: boolean;
  title: string;
  currentUser: User | null;
  roles?: Role[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'create', v: Pick<UserDTO, 'name' | 'phone' | 'password' | 'roleId'>): void;
  (e: 'update', v: Pick<UserDTO, 'name' | 'phone' | 'password' | 'id' | 'roleId'>): void;
}>();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const local = reactive<Pick<UserDTO, 'name' | 'password' | 'phone' | 'id' | 'roleId'>>({
  name: '',
  phone: '',
  password: '',
  id: '',
  roleId: '',
});

const state = reactive({
  touched: false,
  touchedField: { name: false, phone: false, password: false, roleId: false } as Record<
    'name' | 'phone' | 'password' | 'roleId',
    boolean
  >,
  errors: { name: '', phone: '', password: '', roleId: '' } as Record<
    'name' | 'phone' | 'password' | 'roleId',
    string
  >,
});

function resetForm(from?: User | null) {
  if (from) {
    local.name = from.name ?? '';
    local.password = ''; // безопасней по умолчанию пустой
    local.phone = from.phone ?? '';
    local.id = String(from.id ?? '');
    const currentRoleId = (from as any)?.roleId || (from as any)?.role?.id || '';
    local.roleId = String(currentRoleId ?? '');
  } else {
    local.name = '';
    local.password = '';
    local.phone = '';
    local.id = '';
    local.roleId = props.roles?.[0]?.id ?? '';
  }
  state.touched = false;
  state.touchedField = { name: false, phone: false, password: false, roleId: false };
  state.errors = { name: '', phone: '', password: '', roleId: '' };
}

watch(
  () => props.currentUser,
  (q) => resetForm(q),
  { immediate: true },
);
watch(open, (v) => {
  if (v) resetForm(props.currentUser);
});

// нормализация телефона
const normalizePhone = (s: string) => {
  const d = (s || '').replace(/\s+/g, '');
  if (!d.startsWith('+') && /^\d+$/.test(d)) return '+' + d;
  return d;
};

// валидаторы (без сайд-эффектов)
const validName = computed(() => (local.name ?? '').trim().length >= 2);
const validPhone = computed(() => {
  const p = (local.phone ?? '').replace(/[^\d+]/g, '');
  return /^\+?\d{5,20}$/.test(p);
});
const validPassword = computed(() => {
  if (props.currentUser) return local.password.trim().length === 0 || local.password.length >= 3;
  return local.password.trim().length >= 3;
});
const validRole = computed(() => !props.roles?.length || !!local.roleId);

const canSubmit = computed(
  () => validName.value && validPhone.value && validPassword.value && validRole.value,
);

// ошибки на блюре/сабмите
function fillErrors() {
  state.errors = {
    name: validName.value ? '' : 'Укажите имя (мин. 2 символа).',
    phone: validPhone.value ? '' : 'Телефон выглядит некорректно.',
    password: validPassword.value
      ? ''
      : props.currentUser
      ? 'Минимум 3 символа, либо оставьте пустым.'
      : 'Минимум 3 символа.',
    roleId: validRole.value ? '' : 'Выберите роль пользователя.',
  };
  return canSubmit.value;
}
function markTouched(field?: 'name' | 'phone' | 'password' | 'roleId') {
  if (field) state.touchedField[field] = true;
  state.touched = true;
}

function onCreate() {
  markTouched();
  if (!fillErrors()) return;
  emit('create', {
    name: local.name.trim(),
    phone: normalizePhone(local.phone),
    password: local.password,
    roleId: local.roleId || (props.roles?.[0]?.id ?? ''),
  });
  emit('update:modelValue', false);
}
function onUpdate() {
  markTouched();
  if (!fillErrors()) return;
  emit('update', {
    id: local.id,
    name: local.name.trim(),
    phone: normalizePhone(local.phone),
    password: local.password, // пустая строка → не меняем на бэке
    roleId: local.roleId || (props.roles?.[0]?.id ?? ''),
  });
  emit('update:modelValue', false);
}

const hasErr = (key: 'name' | 'phone' | 'password' | 'roleId') =>
  (state.touched && state.errors[key]) || (state.touchedField[key] && state.errors[key]);
</script>

<template>
  <Modal v-model="open" :title="title">
    <div class="form">
      <label class="field" :class="{ invalid: hasErr('name') }">
        <span class="lbl">Имя</span>
        <input
          type="text"
          placeholder="Иван Иванов"
          v-model="local.name"
          @blur="
            markTouched('name');
            fillErrors();
          "
          :aria-invalid="!!state.errors.name"
          aria-describedby="err-name"
          autofocus
        />
        <span v-if="hasErr('name')" id="err-name" class="err">{{ state.errors.name }}</span>
      </label>

      <label class="field" :class="{ invalid: hasErr('phone') }">
        <span class="lbl">Номер телефона</span>
        <input
          type="text"
          placeholder="+7777777777"
          v-model="local.phone"
          @blur="
            markTouched('phone');
            fillErrors();
          "
          :aria-invalid="!!state.errors.phone"
          aria-describedby="err-phone"
        />
        <span v-if="hasErr('phone')" id="err-phone" class="err">{{ state.errors.phone }}</span>
      </label>

      <label class="field" :class="{ invalid: hasErr('password') }">
        <span class="lbl">Пароль</span>
        <input
          type="password"
          placeholder="***********"
          v-model="local.password"
          @blur="
            markTouched('password');
            fillErrors();
          "
          :aria-invalid="!!state.errors.password"
          aria-describedby="err-pass"
        />
        <span v-if="hasErr('password')" id="err-pass" class="err">{{ state.errors.password }}</span>
        <span v-if="props.currentUser" class="hint"
          >Можно оставить пустым, чтобы не менять пароль</span
        >
      </label>

      <label class="field" :class="{ invalid: hasErr('roleId') }">
        <span class="lbl">Роль</span>
        <select
          v-model="local.roleId"
          @blur="
            markTouched('roleId');
            fillErrors();
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
        <Button variant="soft" class="mt12" @click="emit('update:modelValue', false)"
          >Отменить</Button
        >
        <Button
          variant="primary"
          class="mt12"
          :disabled="!canSubmit"
          @click="props.currentUser ? onUpdate() : onCreate()"
        >
          {{ props.currentUser ? '＋ Редактировать' : '＋ Создать' }}
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
