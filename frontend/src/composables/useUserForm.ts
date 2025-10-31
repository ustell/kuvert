import { reactive, computed } from 'vue';
import type { User } from '../types/domain';

type Role = { id: string; name: string };

export function useUserForm() {
  const local = reactive({
    name: '',
    phone: '',
    password: '',
    id: '',
    roleId: '' as string | number | undefined,
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

  const normalizePhone = (s: string) => {
    const d = (s || '').replace(/\s+/g, '');
    if (!d.startsWith('+') && /^\d+$/.test(d)) return '+' + d;
    return d;
  };

  const validName = computed(() => (local.name ?? '').trim().length >= 2);
  const validPhone = computed(() => {
    const p = (local.phone ?? '').replace(/[^\d+]/g, '');
    return /^\+?\d{5,20}$/.test(p);
  });
  const validPassword = computed(() => {
    // caller decides whether currentUser exists; validation message logic lives in fillErrors
    return local.password.trim().length >= 3 || local.password.trim().length === 0;
  });
  const validRole = computed(() => !!local.roleId);

  const canSubmit = computed(
    () => validName.value && validPhone.value && validPassword.value && validRole.value,
  );

  function fillErrors(hasCurrentUser = false) {
    state.errors = {
      name: validName.value ? '' : 'Укажите имя (мин. 2 символа).',
      phone: validPhone.value ? '' : 'Телефон выглядит некорректно.',
      password: local.password.trim().length
        ? local.password.length >= 3
          ? ''
          : 'Минимум 3 символа.'
        : hasCurrentUser
        ? ''
        : 'Минимум 3 символа.',
      roleId: validRole.value ? '' : 'Выберите роль пользователя.',
    };
    return canSubmit.value;
  }

  function markTouched(field?: 'name' | 'phone' | 'password' | 'roleId') {
    if (field) state.touchedField[field] = true;
    state.touched = true;
  }

  function resetForm(from?: User | null, roles?: Role[] | undefined) {
    if (from) {
      local.name = from.name ?? '';
      local.password = '';
      local.phone = from.phone ?? '';
      local.id = String(from.id ?? '');
      const currentRoleId = (from as any)?.roleId ?? (from as any)?.role?.id ?? '';
      local.roleId =
        currentRoleId === undefined || currentRoleId === null ? '' : String(currentRoleId);
    } else {
      local.name = '';
      local.password = '';
      local.phone = '';
      local.id = '';
      local.roleId = roles?.[0]?.id ?? '';
    }
    state.touched = false;
    state.touchedField = { name: false, phone: false, password: false, roleId: false };
    state.errors = { name: '', phone: '', password: '', roleId: '' };
  }

  function toCreateDto() {
    return {
      name: local.name.trim(),
      phone: normalizePhone(local.phone),
      password: local.password,
      // IDs are UUID strings; do not cast to number
      roleId: local.roleId ? String(local.roleId) : undefined,
    } as const;
  }

  function toUpdateDto() {
    return {
      id: local.id,
      name: local.name.trim(),
      phone: normalizePhone(local.phone),
      password: local.password,
      // allow clearing role by sending null; otherwise send string id
      roleId:
        local.roleId === ''
          ? null
          : (local.roleId ? String(local.roleId) : undefined),
    } as const;
  }

  const hasErr = (key: 'name' | 'phone' | 'password' | 'roleId') =>
    (state.touched && state.errors[key]) || (state.touchedField[key] && state.errors[key]);

  return {
    local,
    state,
    canSubmit,
    fillErrors,
    markTouched,
    resetForm,
    toCreateDto,
    toUpdateDto,
    hasErr,
  };
}
