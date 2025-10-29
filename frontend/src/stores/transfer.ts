import { defineStore } from 'pinia';
import type { Transaction } from '../types/domain';
import http from '../libs/http';
import { nextSeq, isLatest } from './_utils';
import { unwrapList } from '../libs/api';

type CanonicalStatus = 'pending' | 'accepted' | 'rejected';
const normalizeStatus = (s: any): CanonicalStatus => {
  const v = String(s ?? '').toLowerCase();
  if (v === 'pending' || v === 'accepted' || v === 'rejected') return v as CanonicalStatus;
  if (v === 'completed') return 'accepted';
  if (v === 'declined' || v === 'canceled' || v === 'cancelled') return 'rejected';
  if (v === 'reserved' || v === 'waiting') return 'pending';
  return 'pending';
};

type CreateOptions = { allowPartial?: boolean; force?: boolean };

export const useTrans = defineStore('trans', {
  state: () => ({
    transfer: null as Transaction[] | null,
    loading: false,
    error: null as string | null,
    busy: new Set<string>(),
    creating: false,
    lastUpdatedAt: null as Date | null,
    _reqSeq: 0,
  }),

  getters: {
    hasData: (s) => Array.isArray(s.transfer) && s.transfer.length > 0,
  },

  actions: {
    _setBusy(id: string, v: boolean) {
      const s = new Set(this.busy);
      v ? s.add(id) : s.delete(id);
      this.busy = s;
    },

    async fetchItems(signal?: AbortSignal) {
      const seq = nextSeq(this);
      this.loading = true;
      this.error = null;
      try {
        const res = await http('GET', 'api/auth/transfer', undefined, { signal, delay: 10_000 });
        if (!res.ok) {
          if (isLatest(this, seq)) this.error = res.error ?? `HTTP ${res.status}`;
          return false;
        }
        const items = unwrapList<Transaction>(res.data).map((t) => ({
          ...t,
          status: normalizeStatus((t as any).status),
        }));
        if (isLatest(this, seq)) {
          this.transfer = items;
          this.lastUpdatedAt = new Date();
        }
        return true;
      } catch (e: any) {
        if (isLatest(this, seq)) this.error = e?.message ?? 'Произошла ошибка';
        return false;
      } finally {
        if (isLatest(this, seq)) this.loading = false;
      }
    },

    async create(
      userFromId: string,
      userToId: string | { value: string },
      itemToTransfer: Array<{ itemId: string; qty: number }>,
      qty: any,
      options?: CreateOptions,
    ) {
      this.creating = true;
      this.error = null;
      try {
        const payload = {
          userFromId,
          userToId: String(typeof userToId === 'string' ? userToId : userToId?.value),
          itemToTransfer,
          qty,
          ...(options ?? {}),
        };
        const res = await http<{ data: Transaction | Transaction[]; errors?: any[] }>(
          'POST',
          '/api/auth/transfer',
          payload,
          { delay: 30_000 },
        );
        if (!res.ok) {
          this.error = res.error ?? `HTTP ${res.status}`;
          const payload = (res.data as any) ?? {};
          const issues = Array.isArray(payload?.errors)
            ? payload.errors
            : payload?.status || payload?.message || payload?.details
            ? [payload]
            : [];
          return { ok: false, error: this.error, issues, errorBody: payload };
        }
        const raw = (res.data as any)?.data ?? res.data;
        const list: Transaction[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const normalized = list.map((t) => ({ ...t, status: normalizeStatus((t as any).status) }));

        if (!this.transfer) this.transfer = [];
        if (normalized.length) {
          const byId = new Map(this.transfer.map((t) => [t.id, t]));
          normalized.forEach((t) => byId.set(t.id, t));
          this.transfer = Array.from(byId.values());
        }
        this.lastUpdatedAt = new Date();
        return { ok: true, data: normalized };
      } catch (e: any) {
        this.error = e?.message ?? 'Unknown error';
        return { ok: false, error: this.error, issues: [] };
      } finally {
        this.creating = false;
      }
    },

    async accept(transferId: string, userId: string) {
      this.error = null;
      this._setBusy(transferId, true);
      const prev = this.transfer?.find((t) => t.id === transferId);
      const prevStatus = prev?.status;
      if (prev) prev.status = 'accepted';

      try {
        const res = await http('PATCH', '/api/auth/transfer', { transferId, userId });
        if (!res.ok) {
          this.error = res.error ?? `HTTP ${res.status}`;
          if (prev) prev.status = prevStatus!;
          return { ok: false, error: this.error };
        }
        this.lastUpdatedAt = new Date();
        return { ok: true };
      } catch (e: any) {
        this.error = e?.message ?? 'Unknown error';
        if (prev) prev.status = prevStatus!;
        return { ok: false, error: this.error };
      } finally {
        this._setBusy(transferId, false);
      }
    },

    async reject(transferId: string, userId: string) {
      this.error = null;
      this._setBusy(transferId, true);
      const prev = this.transfer?.find((t) => t.id === transferId);
      const prevStatus = prev?.status;
      if (prev) prev.status = 'rejected';

      try {
        const res = await http('DELETE', '/api/auth/transfer', { transferId, userId });
        if (!res.ok) {
          this.error = res.error ?? `HTTP ${res.status}`;
          if (prev) prev.status = prevStatus!;
          return { ok: false, error: this.error };
        }
        this.lastUpdatedAt = new Date();
        return { ok: true };
      } catch (e: any) {
        this.error = e?.message ?? 'Unknown error';
        if (prev) prev.status = prevStatus!;
        return { ok: false, error: this.error };
      } finally {
        this._setBusy(transferId, false);
      }
    },
  },
});
