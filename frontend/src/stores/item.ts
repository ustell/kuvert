import { defineStore } from 'pinia';
import type { Item } from '../types/domain';
import http from '../libs/http';
import {
  TTL,
  isFresh,
  nextSeq,
  isLatest,
  upsertById,
  removeById,
  now,
  withLoading,
} from './_utils';
import { unwrapList } from '../libs/api';

type State = {
  items: Item[];
  loading: boolean;
  error: string | null;
  isLoaded: boolean;
  lastFetched: number | null;
  _reqSeq: number;
};

export const useItem = defineStore('item', {
  state: (): State => ({
    items: [],
    loading: false,
    error: null,
    isLoaded: false,
    lastFetched: null,
    _reqSeq: 0,
  }),

  getters: {
    list: (s) => s.items,
    byId: (s) => (id: string) => s.items.find((i) => String(i.id) === String(id)) ?? null,
  },

  actions: {
    invalidate() {
      this.isLoaded = false;
      this.lastFetched = null;
    },

    async fetchItems(signal?: AbortSignal, force = false) {
      if (!force && this.isLoaded && isFresh(this.lastFetched, TTL.short)) return true;

      const seq = nextSeq(this);
      return withLoading(this, async () => {
        this.error = null;
        const res = await http('GET', '/api/auth/items', undefined, { signal, delay: 10_000 });
        if (!res.ok) {
          if (isLatest(this, seq)) this.error = res.error ?? `HTTP ${res.status}`;
          return false;
        }
        if (isLatest(this, seq)) {
          this.items = unwrapList<Item>(res.data);
          this.isLoaded = true;
          this.lastFetched = now();
        }
        return true;
      });
    },

    async deleteItem(id: string, optimistic = true) {
      this.error = null;
      const prev = this.items;
      if (optimistic) this.items = removeById(prev, id);

      try {
        const res = await http('DELETE', '/api/auth/items', { id }, { delay: 15_000 });
        if (!res.ok) {
          this.error = res.error ?? 'Не удалось удалить товар';
          if (optimistic) this.items = prev;
          return false;
        }
        return true;
      } catch (e: any) {
        this.error = e?.message ?? 'Network error';
        if (optimistic) this.items = prev;
        return false;
      }
    },

    async createItem(
      sku: string,
      name: string,
      comp?: Array<{ sku: string; qty: number }>,
      optimistic = true,
    ) {
      this.error = null;
      const tempId = `tmp_${Date.now()}`;
      const prev = this.items;
      if (optimistic) this.items = [{ id: tempId, sku, name, comp } as any, ...prev];

      try {
        const res = await http<{ item: Item }>(
          'POST',
          '/api/auth/items',
          { sku, name, comp },
          { delay: 20_000 },
        );
        if (!res.ok) {
          this.error = res.error ?? 'Ошибка при создании';
          if (optimistic) this.items = prev;
          return false;
        }

        const payload = ((res.data as any)?.item ?? res.data) as Item | null;
        if (!payload) {
          await this.fetchItems(undefined, true);
          return true;
        }

        this.items = optimistic
          ? (() => {
              const idx = this.items.findIndex((i) => i.id === tempId);
              return idx !== -1
                ? [...this.items.slice(0, idx), payload, ...this.items.slice(idx + 1)]
                : upsertById(this.items, payload);
            })()
          : upsertById(this.items, payload);

        return true;
      } catch (e: any) {
        this.error = e?.message ?? 'Network error';
        if (optimistic) this.items = prev;
        return false;
      }
    },

    async updateItem(
      id: string,
      sku: string,
      name: string,
      comp?: Array<{ id?: string; sku?: string; qty?: number }>,
      optimistic = true,
    ) {
      this.error = null;

      const idx = this.items.findIndex((i) => String(i.id) === String(id));
      const prevItem = idx !== -1 ? { ...this.items[idx] } : null;

      if (optimistic && idx !== -1) {
        this.items = [
          ...this.items.slice(0, idx),
          { ...this.items[idx], sku, name, comp } as Item,
          ...this.items.slice(idx + 1),
        ];
      }

      try {
        const res = await http<{ data?: Item; item?: Item }>('PATCH', '/api/auth/items', {
          id,
          sku,
          name,
          comp,
        });
        if (!res.ok) {
          this.error = res.error ?? 'Ошибка при обновлении';
          if (optimistic && idx !== -1 && prevItem) {
            this.items = [...this.items.slice(0, idx), prevItem, ...this.items.slice(idx + 1)];
          }
          return false;
        }

        const payload = (res.data as any)?.data ?? (res.data as any)?.item ?? null;
        this.items = payload ? upsertById(this.items, payload) : this.items;
        if (!payload) await this.fetchItems(undefined, true);
        return true;
      } catch (e: any) {
        this.error = e?.message ?? 'Network error';
        if (optimistic && idx !== -1 && prevItem) {
          this.items = [...this.items.slice(0, idx), prevItem, ...this.items.slice(idx + 1)];
        }
        return false;
      }
    },
  },
});
