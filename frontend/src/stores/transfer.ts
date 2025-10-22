import { defineStore } from 'pinia';
import type { Inventory, Recipe, Transaction } from '../types/domain';
import http from '../libs/http';

type HttpRecipes = { data: Recipe[] } | { data: { items: Recipe[] } };

export const useTrans = defineStore('trans', {
  state: () => ({
    transfer: null as Array<Transaction> | null,
    loading: false as boolean,
    error: null as string | null,
  }),
  actions: {
    async fetchItems(signal?: AbortSignal) {
      this.loading = true;
      this.error = null;
      const row = await http<HttpRecipes>('GET', 'api/auth/transfer', undefined, {
        delay: 1000,
        signal,
      });
      if (!row.ok) {
        this.error = 'Поизошла ошибка';
        return false;
      }
      const payload = (row.data as any).data ?? row.data ?? [];
      const items = payload && (payload.items ?? payload);
      console.log(items);
      this.transfer = items;
      return true;
    },
    async create(
      userFromId: string,
      userToId: string | { value: string },
      itemToTransfer: object,
      qty: number,
    ) {
      this.loading = true;
      this.error = null;
      try {
        const toId = typeof userToId === 'string' ? userToId : userToId.value;
        console.log(userFromId, toId, itemToTransfer, qty);
        const res = await http<{ data: Inventory }>('POST', '/api/auth/transfer', {
          userFromId,
          userToId: toId,
          itemToTransfer,
          qty,
        });

        if (!res.ok) {
          this.error = res.error ?? `HTTP ${res.status}`;
          return { ok: false, error: this.error };
        }
        console.log(res.data);
        this.transfer = res.data;
        return { ok: true, ...res.data };
      } catch (e: any) {
        this.error = e?.message ?? 'Unknown error';
        return { ok: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async accept(transferId: string, userId: string) {
      this.loading = true;
      this.error = null;
      try {
        const res = await http('PATCH', '/api/auth/transfer', { transferId, userId });
        if (!res.ok) {
          this.error = res.error ?? `HTTP ${res.status}`;
          return { ok: false, error: this.error, data: res.data };
        }
        return { res };
      } catch (e: any) {
        this.error = e?.message ?? 'Unknown error';
        return { ok: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async reject(transferId: string, userId: string) {
      this.loading = true;
      this.error = null;
      try {
        const res = await http('DELETE', '/api/auth/transfer', { transferId, userId });
        if (!res.ok) {
          this.error = res.error ?? `HTTP ${res.status}`;
          return { ok: false, error: this.error, data: res.data };
        }
        return { res };
      } catch (e: any) {
        this.error = e?.message ?? 'Unknown error';
        return { ok: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },
  },
});
