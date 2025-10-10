import { defineStore } from 'pinia';
import type { Inventory, User } from '../types/domain';
import { tokenStorage } from '../libs/token';
import http from '../libs/http';

type State = {
  users: User | null;
  loading: boolean;
  error: string | null;
  isFetchingMe: boolean;
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
    authHeaders() {
      const token = tokenStorage.get();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
    async login(phone: string, password: string) {
      this.loading = true;
      try {
        const res = await http<{
          data?: { user?: User; token?: string };
          user?: User;
          token?: string;
        }>('POST', 'api/auth/login', { phone, password });
        if (!res.ok) {
          this.error = res.error ?? `HTTP ${res.status}`;
        }
        const payload = (res.data as any).data ?? res.data ?? {};
        const user = (payload && (payload.user ?? payload)) as User | undefined;
        const token = (payload && payload.token) ?? (res.data as any).token ?? null;
        console.log('=====PAYLOAD=====');
        console.log(payload);
        console.log('======USER======');
        console.log(user);
        console.log('======TOKEN======');
        console.log(token);

        if (!user) {
          this.error = 'User not found';
          return;
        }
        if (token && typeof token === 'string') {
          tokenStorage.set(token);
        }
        this.users = user;
        return true;
      } catch (err: any) {
        this.error = err?.message ?? 'Unknown error';
        return false;
      } finally {
        this.loading = false;
      }
    },

    async me(signal?: AbortSignal) {
      this.loading = true;
      this.isFetchingMe = true;
      try {
        const res = await http<{ data?: User; user?: User }>('GET', 'api/auth/me', undefined, {
          Headers: this.authHeaders(),
          signal,
          timeoutMs: 8000,
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            tokenStorage.clear();
            console.log('tokenStorage.clear();');
            this.users = null;
          }
          this.error = res.error ?? `HTTP ${res.status}`;
          return false;
        }
        const payload = (res.data as any).data ?? res.data ?? res;
        const user = (payload && (payload.user ?? payload)) as User | null;
        this.users = user;
        console.log(user);
        return true;
      } catch (err: any) {
        this.error = err?.message ?? 'Unknown error';
        return false;
      } finally {
        this.loading = false;
        this.isFetchingMe = false;
      }
    },
  },
});
