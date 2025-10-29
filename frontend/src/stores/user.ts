import { defineStore } from 'pinia';
import type { User } from '../types/domain';
import type { UserDTO } from '../types/DTO';
import http from '../libs/http';
import { TTL, isFresh, nextSeq, isLatest, upsertById } from './_utils';

type Store = {
  users: User[];
  loading: boolean;
  error: string | null;
  isLoaded: boolean;
  lastFetched: number | null;
  _reqSeq: number;
};

export const useUsers = defineStore('users', {
  state: (): Store => ({
    users: [],
    loading: false,
    error: null,
    isLoaded: false,
    lastFetched: null,
    _reqSeq: 0,
  }),

  getters: {
    count: (s) => s.users.length,
    byId: (s) => (id: string) => s.users.find((u) => String(u.id) === String(id)) ?? null,
  },

  actions: {
    invalidate() {
      this.isLoaded = false;
      this.lastFetched = null;
    },

    async getUser(force = false) {
      if (!force && this.isLoaded && isFresh(this.lastFetched, TTL.medium)) return true;

      const seq = nextSeq(this);
      this.loading = true;
      this.error = null;

      try {
        const res = await http('GET', '/api/auth/users');
        if (!res.ok) {
          if (isLatest(this, seq)) this.error = res.error ?? `HTTP ${res.status}`;
          return false;
        }
        const payload = (((res.data as any)?.data ?? res.data) as User[]) || [];
        if (isLatest(this, seq)) {
          this.users = [...payload];
          this.isLoaded = true;
          this.lastFetched = Date.now();
        }
        return true;
      } catch (e: any) {
        if (isLatest(this, seq)) this.error = e?.message ?? 'Network error';
        return false;
      } finally {
        if (isLatest(this, seq)) this.loading = false;
      }
    },

    async create({ name, phone, password, roleId }: UserDTO, optimistic = true) {
      this.loading = true;
      this.error = null;

      if (!name?.trim() || !phone?.trim() || !password?.trim()) {
        this.error = 'Обязательные поля не заполнены';
        this.loading = false;
        return false;
      }

      const tmpId = `tmp_${Date.now()}`;
      const tmp: User = {
        id: tmpId,
        name,
        phone,
        password,
        roleId: roleId ?? null,
        ...(roleId ? { role: { id: roleId, name: '' } as any } : {}),
      } as any;

      if (optimistic) this.users = [tmp, ...this.users];

      try {
        const res = await http<{ user: User }>('POST', '/api/auth/users', {
          name,
          phone,
          password,
          roleId,
        });
        if (!res.ok) {
          this.error = res.error ?? 'Ошибка при создании пользователя';
          if (optimistic) this.users = this.users.filter((u) => u.id !== tmpId);
          return false;
        }

        const payload = ((res.data as any)?.user ?? res.data) as User;
        if (optimistic) {
          const i = this.users.findIndex((u) => u.id === tmpId);
          this.users =
            i !== -1
              ? [...this.users.slice(0, i), payload, ...this.users.slice(i + 1)]
              : [payload, ...this.users];
        } else {
          this.users = [payload, ...this.users];
        }
        return true;
      } catch (e: any) {
        this.error = e?.message ?? 'Network error';
        if (optimistic) this.users = this.users.filter((u) => u.id !== tmpId);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async delete(id: string, optimistic = true) {
      this.loading = true;
      this.error = null;

      const prev = this.users;
      if (optimistic) this.users = prev.filter((u) => u.id !== id);

      try {
        const res = await http('DELETE', '/api/auth/users', { id });
        if (!res.ok) {
          this.error = res.error ?? 'Не удалось удалить пользователя';
          if (optimistic) this.users = prev;
          return false;
        }
        return true;
      } catch (e: any) {
        this.error = e?.message ?? 'Network error';
        if (optimistic) this.users = prev;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async update({ id, name, phone, password, roleId }: UserDTO, optimistic = true) {
      this.loading = true;
      this.error = null;

      const idx = this.users.findIndex((u) => u.id === id);
      const prev = idx !== -1 ? { ...this.users[idx] } : null;

      if (optimistic && idx !== -1) {
        const patch: Partial<User> = { id, name, phone, password, roleId } as any;
        this.users = [
          ...this.users.slice(0, idx),
          { ...this.users[idx], ...patch },
          ...this.users.slice(idx + 1),
        ];
      }

      try {
        const res = await http<{ user: User }>('PATCH', '/api/auth/users', {
          id,
          name,
          phone,
          password,
          roleId,
        });
        if (!res.ok) {
          this.error = res.error ?? 'Ошибка при обновлении пользователя';
          if (optimistic && idx !== -1 && prev) {
            this.users = [...this.users.slice(0, idx), prev, ...this.users.slice(idx + 1)];
          }
          return false;
        }

        const payload = ((res.data as any)?.user ?? res.data) as User;
        if (payload) this.users = upsertById(this.users, payload);
        return true;
      } catch (e: any) {
        this.error = e?.message ?? 'Network error';
        if (optimistic && idx !== -1 && prev) {
          this.users = [...this.users.slice(0, idx), prev, ...this.users.slice(idx + 1)];
        }
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
