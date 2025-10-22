import { defineStore } from 'pinia';
import type { Item } from '../types/domain';
import http from '../libs/http';

export const useItem = defineStore('item', {
  state: () => ({
    items: undefined as Item[] | undefined,
    loading: false as boolean,
    error: '' as string | null,
    isLoaded: false as boolean,
    lastFetched: null as number | null,
  }),
  actions: {
    async fetchItems(signal?: AbortSignal): Promise<boolean> {
      const now = Date.now();
      try {
        if (this.isLoaded && this.lastFetched && now - this.lastFetched < 50000) {
          console.log('lastFetched', this.lastFetched, now);
          return false;
        }
        this.loading = true;
        this.error = null;
        const row = await http<{ data: Item[] }>('GET', 'api/auth/items', undefined, {
          delay: 1000,
          signal,
        });
        if (!row.ok) {
          this.error = 'Поизошла ошибка';
          return false;
        }
        const payload = (row.data as any).data ?? row.data ?? [];
        const items = (payload && (payload.items ?? payload)) as Item[];
        console.log(items);
        if (items.length === 0) {
          this.error = 'Ничего не найдено';
        }
        this.isLoaded = true;
        this.lastFetched = now;
        this.items = items;
        return true;
      } catch (error) {
        this.error = 'Поизошла ошибка';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async deleteItem(id: string) {
      this.error = null;
      this.loading = true;
      try {
        const row = await http('DELETE', 'api/auth/items', { id });
        if (!row.ok) {
          this.error = 'Pinia error';
          return false;
        }
        this.items = this.items?.filter((i) => i.id !== id);
      } catch (error) {
        console.log('error', error);
      } finally {
        this.loading = false;
      }
    },
    async createItem(sku: string, name: string, comp?: []) {
      this.error = '';
      this.loading = true;
      try {
        const res = await http<{ item: Item }>(
          'POST',
          '/api/auth/items',
          { sku, name, comp }, // ← массив { sku, qty }
          { delay: 3000 },
        );

        if (!res.ok) {
          this.error = (res as any).error || 'Server returned an error';
          return false;
        }

        const payload = (res.data as any).item ?? res.data;
        if (!payload) {
          this.error = 'Server returned an error';
          return false;
        }
        this.items?.push(payload);
        return true;
      } catch (error) {
        console.log('Server error', error);
        this.error = 'Server error';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async updateItem(
      id: string,
      sku: string,
      name: string,
      comp?: Array<{ id?: string; sku?: string; qty?: number }>,
    ) {
      this.loading = true;
      this.error = null;
      try {
        const res = await http<{ data: Item }>(
          'PATCH',
          '/api/auth/items', // <-- ведущий слэш
          { id, sku, name, comp },
          undefined,
        );
        if (!res.ok) {
          console.log('ОШИБКА', res.error);
          return false;
        }
        const payload = res.data?.data;
        if (payload) {
          const index = this.items!.findIndex((i) => i.id === id);
          if (index !== -1) {
            this.items!.splice(index, 1, payload);
          }
        }
        return true;
      } catch (error) {
        console.log('error', error);
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
