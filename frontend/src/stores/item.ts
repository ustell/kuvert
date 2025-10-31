import { defineStore } from 'pinia';
import type { Item } from '../types/domain';
// http is now wrapped by apiClient
import apiClient from '../libs/apiClient';
import { formatError } from '../libs/errorHandler';
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
// unwrapList no longer used in this store (apiClient pre-normalizes responses)

type State = {
  items: Item[];
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

export const useItem = defineStore('item', {
  state: (): State => ({
    items: [],
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
    list: (s) => s.items,
    byId: (s) => (id: string) => s.items.find((i) => String(i.id) === String(id)) ?? null,
  },

  actions: {
    invalidate() {
      this.isLoaded = false;
      this.lastFetched = null;
    },

    async fetchItems(
      signal?: AbortSignal,
      force = false,
      page = 1,
      limit: number | null = null,
      append = false,
    ) {
      // if not force and already loaded recently and requesting first page, skip
      if (!force && page === 1 && this.isLoaded && isFresh(this.lastFetched, TTL.short))
        return true;

      const seq = nextSeq(this);
      return withLoading(this, async () => {
        this.error = null;
        // when limit === null request full list (all=true)
        const res =
          limit === null
            ? await apiClient.getItems(undefined, undefined, signal, true)
            : await apiClient.getItems(page, limit, signal);
        if (!res.ok) {
          if (isLatest(this, seq)) this.error = formatError(res);
          return false;
        }

        if (isLatest(this, seq)) {
          const incoming = res.data ?? [];
          if (append) this.items = [...this.items, ...incoming];
          else this.items = incoming;

          this.isLoaded = true;
          this.lastFetched = now();
          this.page = page;
          this.limit = limit as any;
          const meta = (res as any).meta as any;
          if (meta) {
            this.total = meta.total ?? null;
            this.hasMore = meta.page * meta.limit < (meta.total ?? 0);
          } else {
            // if requesting full list (limit === null) consider there's no more
            this.total = incoming.length ?? null;
            this.hasMore = limit !== null ? incoming.length === limit : false;
          }
        }
        return true;
      });
    },

    async deleteItem(id: string, optimistic = true) {
      this.error = null;
      const prev = this.items;
      if (optimistic) this.items = removeById(prev, id);

      try {
        const res = await apiClient.deleteItem(id);
        if (!res.ok) {
          this.error = formatError(res);
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
        const res = await apiClient.createItem({ sku, name, comp });
        if (!res.ok) {
          this.error = formatError(res);
          if (optimistic) this.items = prev;
          return false;
        }

        const payload = res.data ?? null;
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
        const res = await apiClient.updateItem({ id, sku, name, comp });
        if (!res.ok) {
          this.error = formatError(res);
          if (optimistic && idx !== -1 && prevItem) {
            this.items = [
              ...this.items.slice(0, idx),
              prevItem as Item,
              ...this.items.slice(idx + 1),
            ];
          }
          return false;
        }

        const payload = res.data ?? null;
        this.items = payload ? upsertById(this.items, payload) : this.items;
        if (!payload) await this.fetchItems(undefined, true);
        return true;
      } catch (e: any) {
        this.error = e?.message ?? 'Network error';
        if (optimistic && idx !== -1 && prevItem) {
          this.items = [
            ...this.items.slice(0, idx),
            prevItem as Item,
            ...this.items.slice(idx + 1),
          ];
        }
        return false;
      }
    },
  },
});
