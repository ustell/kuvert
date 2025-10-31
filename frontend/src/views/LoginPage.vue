<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import Card from '../components/Card.vue';
import Button from '../components/Button.vue';
import { useAuth } from '../stores/auth';
import { boot } from '../services/boot';
import {Package} from 'lucide-vue-next';

const phone = ref('');
const password = ref('');
const remember = ref(true);
const show = ref(false);
const auth = useAuth();
const router = useRouter();

const passRef = ref<HTMLInputElement | null>(null);
const telRef = ref<HTMLInputElement | null>(null);
onMounted(() => telRef.value?.focus());

const state = reactive({ touched: false, localError: '' });

function normalizePhone(raw: string) {
  const d = (raw || '').replace(/\D+/g, '');
  if (!d) return '';
  if (d.startsWith('8') && d.length === 11) return '+7' + d.slice(1);
  return d.startsWith('+') ? d : '+' + d;
}

const canSubmit = computed(() => !!phone.value && !!password.value && !auth.loading);

async function onSubmit(e: Event) {
  e.preventDefault();
  state.touched = true;
  state.localError = '';
  const norm = normalizePhone(phone.value);
  const res = await auth.login(norm, password.value, remember.value);

  if (!res?.ok) {
    state.localError = auth.error || 'Ошибка';
    if (res.code === 401 || res.code === 403) {
      password.value = '';
      await nextTick();
      passRef.value?.focus();
    }
    setTimeout(() => (state.localError = ''), 5000);
    return;
  }

  // success → boot data, then role-based redirect
  const u: any = auth.users;
  const isAdmin = !!(
    u?.allowedTargets?.includes?.('admin') ||
    (u?.role?.name && String(u.role.name).toLowerCase() === 'admin')
  );
  // redirect immediately
  await router.replace(isAdmin ? '/admin' : '/');
  // load data in background
  void boot();
}
</script>

<template>
  <div class="container login-wrap">
    <div class="logo"><Package :size="16" color="#333333" /></div>
    <div class="brand">Трекер товара</div>
    <div class="center">Авторизация</div>

    <Card padded>
      <form @submit="onSubmit" novalidate>
        <label class="label">Телефон</label>
        <div class="field">
          <input
            ref="telRef"
            v-model="phone"
            type="tel"
            inputmode="tel"
            class="inp"
            placeholder="+77000000000"
            autocomplete="tel"
            name="phone"
          />
        </div>

        <label class="label ">Пароль</label>
        <div class="field">
          <input
            ref="passRef"
            v-model="password"
            :type="show ? 'text' : 'password'"
            class="inp"
            placeholder="••••••••"
            autocomplete="current-password"
            name="password"
          />
          <button type="button" class="link" @click="show = !show">
            {{ show ? 'Скрыть' : 'Показать' }}
          </button>
        </div>


        <div v-if="state.localError" class="toast error mb-2">⚠ {{ state.localError }}</div>

        <Button
          variant="primary"
          :full="true"
          class="mt-2"
          :disabled="!canSubmit"
          :aria-busy="auth.loading"
        >
          <span class="btn-content">
            <span v-if="auth.loading" class="spinner" aria-hidden="true"></span>
            <span>{{ auth.loading ? 'Входим…' : 'Авторизация' }}</span>
          </span>
        </Button>
      </form>
    </Card>
  </div>
</template>

<style scoped>
.login-wrap {
  padding-top: 36px;
  max-width: 420px;
  margin: 0 auto;
}
.logo {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #eef3ff;
  border: 1px solid #dbe5ff;
  margin: 0 auto 10px;
}
.brand {
  text-align: center;
  font-weight: 800;
}
.center {
  text-align: center;
  margin-bottom: 10px;
}

.label {
  display: block;
  font-weight: 600;
  margin: 8px 0 6px;
}
.field {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
}
.field.error {
  border-color: #fecaca !important;
  background: #fff1f2 !important;
}
.inp {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  color: inherit;
}
.link {
  appearance: none;
  background: transparent;
  border: none;
  color: var(--brand);
  font-weight: 600;
  cursor: pointer;
}
.check {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #2a2f3a;
}

.hint {
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
}
.toast.error {
  margin-top: 12px;
  background: #fff1f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 10px 12px;
  border-radius: 12px;
}
.toast.error ul {
  margin: 0;
  padding-left: 18px;
}

.btn-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
