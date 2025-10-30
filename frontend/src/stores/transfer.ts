// stores/transfer.ts
import { defineStore } from 'pinia';
import type { Transaction } from '../types/domain';
import apiClient from '../libs/apiClient';
import { nextSeq, isLatest, TTL, isFresh, now } from './_utils';
import { useAuth } from './auth';
import { formatError } from '../libs/errorHandler';

type CanonicalStatus = 'pending' | 'accepted' | 'rejected';
const normalizeStatus = (s: any): CanonicalStatus => {
  const v = String(s ?? '').toLowerCase();
  if (v === 'pending' || v === 'accepted' || v === 'rejected') return v as CanonicalStatus;
  if (v === 'completed') return 'accepted';
  if (v === 'declined' || v === 'canceled' || v === 'cancelled') return 'rejected';
  if (v === 'reserved' || v === 'waiting') return 'pending';
  return 'pending';
};

export const useTrans = defineStore('trans', {
  state: () => ({
    transfer: null as Transaction[] | null,
    loading: false,
    error: null as string | null,
    busy: new Set<string>(),
    creating: false,
    lastUpdatedAt: null as Date | null,
    // ttl flags
    isLoaded: false,
    lastFetched: null as number | null,
    _reqSeq: 0,
    limit: 3,
    offset: 0,
    hasMore: false,

    _status: 'all' as string | undefined,
    _q: '' as string,
    _toUserId: undefined as string | undefined,
    _fromUserId: undefined as string | undefined,
    _userId: undefined as string | undefined,
    _mine: undefined as 'to' | 'from' | 'any' | undefined,
    _cursor: null as string | null,
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

    async fetchItems({
      reset = false,
      status,
      q,
      toUserId,
      fromUserId,
      userId,
      mine,
      signal,
    }: {
      reset?: boolean;
      status?: string;
      q?: string;
      toUserId?: string;
      fromUserId?: string;
      userId?: string;
      mine?: 'to' | 'from' | 'any';
      signal?: AbortSignal;
    } = {}) {
      // Detect explicitly provided filter keys to allow proper reset/clear
      const _opts = (arguments as any)[0] || {};
      const hasExplicitFilters = ['status', 'q', 'toUserId', 'fromUserId', 'userId', 'mine', 'cursor'].some(
        (k) => Object.prototype.hasOwnProperty.call(_opts, k),
      );

      // When reset is requested, apply provided filters immediately, even if value is undefined (to clear)
      if (reset) {
        if (Object.prototype.hasOwnProperty.call(_opts, 'status')) this._status = status as any;
        if (Object.prototype.hasOwnProperty.call(_opts, 'q')) this._q = q ?? '';
        if (Object.prototype.hasOwnProperty.call(_opts, 'toUserId')) this._toUserId = toUserId || undefined;
        if (Object.prototype.hasOwnProperty.call(_opts, 'fromUserId')) this._fromUserId = fromUserId || undefined;
        if (Object.prototype.hasOwnProperty.call(_opts, 'userId')) this._userId = userId || undefined;
        if (Object.prototype.hasOwnProperty.call(_opts, 'mine')) this._mine = mine || undefined;
        this._cursor = null;
      }

      // Compute desired comparison AFTER potential immediate filter application
      const desired = {
        status: status ?? this._status,
        q: q ?? this._q,
        toUserId: toUserId ?? this._toUserId,
        fromUserId: fromUserId ?? this._fromUserId,
        userId: userId ?? this._userId,
        mine: mine ?? this._mine,
      };
      const keyMatches =
        String(desired.status ?? '') === String(this._status ?? '') &&
        String(desired.q ?? '') === String(this._q ?? '') &&
        String(desired.toUserId ?? '') === String(this._toUserId ?? '') &&
        String(desired.fromUserId ?? '') === String(this._fromUserId ?? '') &&
        String(desired.userId ?? '') === String(this._userId ?? '') &&
        String(desired.mine ?? '') === String(this._mine ?? '');

      // If requesting the same filter set shortly after load, skip (TTL),
      // BUT do not skip when caller explicitly provided filters (we must honor resets)
      const shouldSkipByTTL = reset && this.isLoaded && keyMatches && isFresh(this.lastFetched, TTL.short) && !hasExplicitFilters;
      if (shouldSkipByTTL) {
        return true;
      }

      const seq = nextSeq(this);
      this.loading = true;
      this.error = null;

      if (reset) {
        this.offset = 0;
        // Do NOT clear existing list here to avoid flicker/race with bootstrap
        // this.transfer = [];
        this.hasMore = false;
        // filters already applied above when reset=true
      }

      try {
        const res = await apiClient.getTransfers(
          undefined, // page
          this.limit, // limit (всегда 5)
          this.offset, // offset
          this._q || undefined, // q
          this._status, // status
          signal,
          {
            toUserId: this._toUserId,
            fromUserId: this._fromUserId,
            userId: this._userId,
            mine: this._mine,
            cursor: this._cursor,
          },
        );

        if (!res.ok) {
          if (isLatest(this, seq)) this.error = formatError(res);
          return false;
        }

        const items = ((res.data ?? []) as Transaction[]).map((t) => ({
          ...t,
          status: normalizeStatus((t as any).status),
        }));

        if (isLatest(this, seq)) {
          // reset → замена; иначе — аппенд
          if (!this.transfer || reset || this.offset === 0) {
            this.transfer = items;
          } else {
            this.transfer = [...this.transfer, ...items];
          }

          // серверная мета или вычисление по длине
          const nextOffset = (res as any).nextOffset as number | undefined;
          const nextCursor = (res as any).nextCursor as string | null | undefined;
          const hasMore = (res as any).hasMore as boolean | undefined;

          this.offset = typeof nextOffset === 'number' ? nextOffset : this.offset + items.length;
          if (nextCursor !== undefined) this._cursor = nextCursor ?? null;
          this.hasMore = typeof hasMore === 'boolean' ? hasMore : items.length === this.limit;

          this.lastUpdatedAt = new Date();
          this.isLoaded = true;
          this.lastFetched = now();
        }
        return true;
      } catch (e: any) {
        if (isLatest(this, seq)) this.error = e?.message ?? 'Произошла ошибка';
        return false;
      } finally {
        if (isLatest(this, seq)) this.loading = false;
      }
    },

    reload(status?: string, signal?: AbortSignal) {
      return this.fetchItems({ reset: true, status, signal });
    },

    // ➕ подгрузка ещё 5
    loadMore(signal?: AbortSignal) {
      if (this.loading || !this.hasMore) return Promise.resolve(false);
      return this.fetchItems({ reset: false, status: this._status, signal });
    },

    async create(
      userFromId: string,
      userToId: string | { value: string },
      itemToTransfer: Array<{ itemId: string; qty: number }>,
      _qty?: any,
      options?: { allowPartial?: boolean; force?: boolean },
    ) {
      this.creating = true;
      this.error = null;
      try {
        const toIdLocal = String(typeof userToId === 'string' ? userToId : userToId?.value);
        const res = await apiClient.createTransfer(
          {
            userFromId,
            userToId: toIdLocal,
            itemToTransfer,
            ...(options ?? {}),
          },
          // Админский принудительный перевод → лёгкий ответ без инвентарей; иначе вернём inventoriesFrom для мгновенного обновления
          { light: !!options?.force },
        );
        if (!res.ok) {
          const payload = (res.data as any) ?? {};
          const issues = Array.isArray(payload?.errors)
            ? payload.errors
            : payload?.status || payload?.message || payload?.details
            ? [payload]
            : [];
          this.error = formatError(res);
          return { ok: false, error: this.error, issues, errorBody: payload };
        }

        // Мгновенно обновим локальный список переводов и инвентарь отправителя
        try {
          const createdList = (res.data as any) as Transaction[];
          if (Array.isArray(createdList) && createdList.length) {
            const normalized = createdList.map((t: any) => ({
              ...t,
              status: normalizeStatus((t as any).status),
            }));
            this.transfer = this.transfer && this.transfer.length
              ? [...normalized, ...this.transfer]
              : normalized;
          }
          const inventoriesFrom = (res as any).inventoriesFrom;
          if (Array.isArray(inventoriesFrom)) {
            const auth = useAuth();
            if (auth.users) (auth.users as any).inventories = inventoriesFrom;
          } else {
            // Мгновенно скорректируем локальный инвентарь отправителя
            try {
              const auth = useAuth();
              if (auth.users) {
                const u: any = auth.users;
                const current = Array.isArray(u.inventories) ? [...u.inventories] : [];
                const byId = new Map<string, any>(current.map((i: any) => [String(i.itemId ?? i.item?.id), i]));

                // 1) если есть snapshot из ответа (non-force), применим его как источник истины
                const snap: Array<{ itemId: string; unitsLeft: number }> = ((res as any).snapshot ?? []) as any;
                if (Array.isArray(snap) && snap.length) {
                  for (const s of snap) {
                    const key = String((s as any).itemId ?? '');
                    if (!key) continue;
                    const found = byId.get(key);
                    if (found) found.units = Number((s as any).unitsLeft ?? 0);
                    else current.push({ userId: u.id, itemId: key, units: Number((s as any).unitsLeft ?? 0) });
                  }
                } else {
                  // 2) иначе (force/light) — уменьшим локально по отправленным позициям
                  const decMap = new Map<string, number>();
                  for (const it of itemToTransfer) {
                    const id = String(it.itemId);
                    const q = Math.max(1, Number(it.qty || 0));
                    decMap.set(id, (decMap.get(id) ?? 0) + q);
                  }
                  for (const [id, dec] of decMap) {
                    const found = byId.get(id);
                    if (found) found.units = Number(found.units ?? 0) - dec;
                    else current.push({ userId: u.id, itemId: id, units: -dec });
                  }
                }

                (auth.users as any).inventories = current;
              }
            } catch {}
            // дополнительно обновим себя в фоне, чтобы выровнять любые расхождения
            try {
              const auth = useAuth();
              if (typeof (auth as any).me === 'function') void (auth as any).me();
            } catch {}
          }
          const inventoriesTo = (res as any).inventoriesTo;
          if (Array.isArray(inventoriesTo)) {
            // Update target user in users store if present
            try {
              const { useUsers } = await import('./user');
              const us = useUsers();
              const idx = us.users.findIndex((u: any) => String(u.id) === toIdLocal);
              if (idx !== -1) {
                const next = [...us.users];
                (next[idx] as any) = { ...(next[idx] as any), inventories: inventoriesTo };
                us.users = next as any;
              }
            } catch {}
          }
        } catch {}
        // Затем подтянем актуальный список (учитывая пагинацию/фильтры) — в фоне,
        // чтобы не блокировать ответ вызывающему коду
        void this.fetchItems();
        return { ok: true, data: this.transfer ?? [] };
      } catch (e: any) {
        this.error = e?.message ?? 'Unknown error';
        return { ok: false, error: this.error, issues: [] };
      } finally {
        this.creating = false;
      }
    },

    async accept(transferId: string, userId: string) {
      this._setBusy(transferId, true);
      const prev = this.transfer?.find((t) => t.id === transferId);
      const backup = prev?.status;
      if (prev) prev.status = 'accepted';
      try {
        const r = await apiClient.acceptTransfer(transferId, userId);
        if (!r.ok) {
          if (prev) prev.status = backup!;
          this.error = formatError(r);
          return { ok: false, error: this.error };
        }
        // If backend returned updated transfer and inventories, apply them locally to avoid refetch
        try {
          const payload: any = (r as any).data ?? {};
          const updated = payload?.transfer ?? null;
          const inventories = payload?.inventories ?? null;
          if (updated) {
            const list = this.transfer ? [...this.transfer] : [];
            const i = list.findIndex((t) => t.id === updated.id);
            const norm = { ...updated, status: normalizeStatus(updated.status) } as any;
            this.transfer = i >= 0 ? (list.splice(i, 1, norm), list) : [norm, ...list];
          }
          if (Array.isArray(inventories)) {
            const auth = useAuth();
            if (auth.users) (auth.users as any).inventories = inventories;
          }
        } catch {}
        // Keep list consistent (handles pagination and other items)
        await this.fetchItems();
        return { ok: true };
      } finally {
        this._setBusy(transferId, false);
      }
    },

    async reject(transferId: string, userId: string) {
      this._setBusy(transferId, true);
      const prev = this.transfer?.find((t) => t.id === transferId);
      const backup = prev?.status;
      if (prev) prev.status = 'rejected';
      try {
        const r = await apiClient.rejectTransfer(transferId, userId);
        if (!r.ok) {
          if (prev) prev.status = backup!;
          this.error = formatError(r);
          return { ok: false, error: this.error };
        }
        // Optionally update local transfer from server payload
        try {
          const payload: any = (r as any).data ?? {};
          const updated = payload?.transfer ?? null;
          if (updated) {
            const list = this.transfer ? [...this.transfer] : [];
            const i = list.findIndex((t) => t.id === updated.id);
            const norm = { ...updated, status: normalizeStatus(updated.status) } as any;
            this.transfer = i >= 0 ? (list.splice(i, 1, norm), list) : [norm, ...list];
          }
        } catch {}
        await this.fetchItems();
        return { ok: true };
      } finally {
        this._setBusy(transferId, false);
      }
    },
  },
});
