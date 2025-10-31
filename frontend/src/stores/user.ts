import { defineStore } from 'pinia';
import type { User } from '../types/domain';
import type { UserDTO } from '../types/DTO';
import apiClient from '../libs/apiClient';
import { formatError } from '../libs/errorHandler';
import { TTL, isFresh, nextSeq, isLatest, upsertById } from './_utils';

type Store = {
  users: User[];
  loading: boolean;
  error: string | null;
  isLoaded: boolean;
  lastFetched: number | null;
  _reqSeq: number;
  page: number;
  limit: number | null;
  total: number | null;
  hasMore: boolean;
};

export const useUsers = defineStore('users', {
  state: (): Store => ({
    users: [],
    loading: false,
    error: null,
    isLoaded: false,
    lastFetched: null,
    _reqSeq: 0,
    page: 0,
    limit: null,
    total: null,
    hasMore: false,
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

    async fetchUserById(id: string, force = false) {
      if (!id) return null;
      // If we already have it and not forced, return from state
      const existing = this.users.find((u) => String(u.id) === String(id));
      if (existing && !force) return existing;

      this.loading = true;
      this.error = null;
      try {
        const res = await apiClient.getUser(id);
        if (!res.ok) {
          this.error = formatError(res);
          return null;
        }
        const payload = res.data as User | null;
        if (payload) {
          this.users = upsertById(this.users, payload);
          return payload;
        }
        return null;
      } catch (e: any) {
        this.error = e?.message ?? 'Network error';
        return null;
      } finally {
        this.loading = false;
      }
    },

    async getUser(force = false, page = 1, limit: number | null = null, append = false) {
      // if not forced and recently loaded and requesting first page, skip
      if (!force && page === 1 && this.isLoaded && isFresh(this.lastFetched, TTL.medium))
        return true;

      const seq = nextSeq(this);
      this.loading = true;
      this.error = null;

      try {
        // if limit is null -> request full list from server (all=true)
        const res =
          limit === null
            ? await apiClient.getUsers(undefined, undefined, undefined, true)
            : await apiClient.getUsers(page, limit);
        if (!res.ok) {
          if (isLatest(this, seq)) this.error = formatError(res);
          return false;
        }
        const payload = (res.data ?? []) as User[];
        if (isLatest(this, seq)) {
          this.users = append ? [...this.users, ...payload] : (payload as User[]);
          this.isLoaded = true;
          this.lastFetched = Date.now();
          this.page = page;
          this.limit = limit as any;
          const meta = (res as any).meta as any;
          if (meta) {
            this.total = meta.total ?? null;
            this.hasMore = meta.page * meta.limit < (meta.total ?? 0);
          } else {
            // when requesting full list (limit === null) we consider there is no more to fetch
            this.total = payload.length ?? null;
            this.hasMore = false;
          }
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

      if (optimistic) this.users = [tmp, ...this.users] as User[];

      try {
        const res = await apiClient.createUser({ name, phone, password, roleId });
        if (!res.ok) {
          this.error = formatError(res);
          if (optimistic) this.users = this.users.filter((u) => u.id !== tmpId);
          return false;
        }

        const payload = res.data as User | null;
        if (optimistic) {
          const i = this.users.findIndex((u) => u.id === tmpId);
          this.users =
            i !== -1
              ? ([...this.users.slice(0, i), payload, ...this.users.slice(i + 1)] as User[])
              : ([payload, ...this.users] as User[]);
        } else {
          this.users = [payload as User, ...this.users] as User[];
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
        const res = await apiClient.deleteUser(id);
        if (!res.ok) {
          this.error = formatError(res);
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
        ] as User[];
      }

      try {
        const res = await apiClient.updateUser({ id, name, phone, password, roleId });
        if (!res.ok) {
          this.error = formatError(res);
          if (optimistic && idx !== -1 && prev) {
            this.users = [...this.users.slice(0, idx), prev as User, ...this.users.slice(idx + 1)];
          }
          return false;
        }

        const payload = res.data as User | null;
        if (payload) this.users = upsertById(this.users, payload);
        return true;
      } catch (e: any) {
        this.error = e?.message ?? 'Network error';
        if (optimistic && idx !== -1 && prev) {
          this.users = [...this.users.slice(0, idx), prev as User, ...this.users.slice(idx + 1)];
        }
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
