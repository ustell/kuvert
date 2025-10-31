// stores/auth.ts
import { defineStore } from 'pinia';
import type { User } from '../types/domain';
import { tokenStorage } from '../libs/token';
import http from '../libs/http';

type State = {
  users: User | null;
  loading: boolean;
  error: string | null;
  isFetchingMe: boolean;
};

const msgByCode = (code: number, fallback?: string) =>
  code === 401 || code === 403
    ? 'Неверные учетные данные'
    : code === 422
    ? 'Проверьте поля формы'
    : code >= 500
    ? 'Сервер временно недоступен'
    : fallback ?? `HTTP ${code}`;

const pickUserToken = (raw: any) => {
  const data = raw?.data ?? raw ?? {};
  return {
    user: (data?.user ?? raw?.user) as User | undefined,
    token: (data?.token ?? raw?.token) as string | undefined,
    allowedTargets: data?.allowedTargets ?? [],
  };
};

export const useAuth = defineStore('auth', {
  state: (): State => ({
    users: null,
    loading: false,
    error: null,
    isFetchingMe: false,
  }),

  getters: {
    isAutorizited: (s) => s.users !== null,
  },

  actions: {
    authHeaders(): Record<string, string> | undefined {
      const token = tokenStorage.get();
      return token ? { Authorization: `Bearer ${token}` } : undefined;
    },

    async login(phone: string, password: string, remember = true) {
      this.loading = true;
      this.error = null;
      try {
        const res = await http('POST', '/api/auth/login', { phone, password });
        if (!res.ok) {
          const message = msgByCode(res.status, res.error);
          this.error = message;
          return { ok: false, code: res.status, message };
        }
        const { user, token, allowedTargets } = pickUserToken(res.data);
        if (!user) {
          this.error = 'Пользователь не найден';
          return { ok: false, code: 0, message: this.error };
        }
        if (remember) tokenStorage.set(token ?? null);
        if (Array.isArray(allowedTargets)) (user as any).allowedTargets = allowedTargets;
        this.users = user;
        return { ok: true };
      } catch (e: any) {
        this.error = e?.message ?? 'Ошибка сети';
        return { ok: false, code: -1, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async me(signal?: AbortSignal) {
      this.loading = true;
      this.isFetchingMe = true;
      try {
        const res = await http('GET', '/api/auth/me', undefined, {
          headers: this.authHeaders(), // 👈 правильное имя headers
          signal,
          timeoutMs: 8000,
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            tokenStorage.clear();
            this.users = null;
          }
          this.error = res.error ?? `HTTP ${res.status}`;
          return false;
        }
        const { user, allowedTargets } = pickUserToken(res.data);
        if (user) (user as any).allowedTargets = allowedTargets;
        this.users = user ?? null;
        return true;
      } catch (e: any) {
        this.error = e?.message ?? 'Unknown error';
        return false;
      } finally {
        this.loading = false;
        this.isFetchingMe = false;
      }
    },

    async logout(localOnly = false) {
      try {
        tokenStorage.clear();
        this.users = null;
        if (!localOnly) {
          await http('POST', '/api/auth/logout').catch(() => {});
        }
      } finally {
        this.loading = false;
        this.error = null;
      }
    },
  },
});
