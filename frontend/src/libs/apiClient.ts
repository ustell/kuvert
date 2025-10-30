import http from './http';
import { tokenStorage } from './token';
import type { HttpResult } from './http';
import type { Item } from '../types/domain';
import type { Transaction } from '../types/domain';
import type { User } from '../types/domain';

export async function getItems(
  page?: number,
  limit?: number,
  signal?: AbortSignal,
  all = false,
  include?: string,
): Promise<HttpResult<Item[]>> {
  // signature: getItems(page?, limit?, signal?, all?, include?)
  async function inner(
    page?: number,
    limit?: number,
    signalInner?: AbortSignal,
    all = false,
    include?: string,
  ) {
    const params: string[] = [];
    if (all) params.push('all=true');
    if (!all) {
      const p = page ?? 1;
      const l = limit ?? 20;
      params.push(`page=${encodeURIComponent(String(p))}`);
      params.push(`limit=${encodeURIComponent(String(l))}`);
    }
    if (include) params.push(`include=${encodeURIComponent(include)}`);
    const url = `/api/auth/items${params.length ? '?' + params.join('&') : ''}`;
    const res = await http('GET', url, undefined, { signal: signalInner, delay: 10_000 });
    if (!res.ok) return res as HttpResult<any>;
    // normalize to list
    const raw = (res.data as any)?.data ?? res.data ?? [];
    const list: Item[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    // preserve pagination meta if present
    const meta = (res.data as any)?.meta ?? null;
    return { ...res, data: list, meta } as any as HttpResult<Item[]>;
  }

  return inner(page, limit, signal, all, include);
}

export async function getItem(
  id: string,
  signal?: AbortSignal,
  include?: string,
): Promise<HttpResult<Item | null>> {
  const params: string[] = [];
  if (include) params.push(`include=${encodeURIComponent(include)}`);
  params.push(`id=${encodeURIComponent(id)}`);
  const url = `/api/auth/items?${params.join('&')}`;
  const res = await http('GET', url, undefined, { signal });
  if (!res.ok) return res as HttpResult<any>;
  const raw = (res.data as any)?.data ?? res.data ?? null;
  return { ...res, data: raw } as HttpResult<Item | null>;
}

export async function createItem(payload: {
  sku: string;
  name: string;
  comp?: Array<{ sku: string; qty: number }>;
}): Promise<HttpResult<Item | null>> {
  const res = await http<{ item?: Item; data?: Item }>('POST', '/api/auth/items', payload, {
    delay: 20_000,
  });
  if (!res.ok) return res as HttpResult<any>;
  const item = (res.data as any)?.item ?? (res.data as any)?.data ?? null;
  return { ...res, data: item } as HttpResult<Item | null>;
}

export async function updateItem(payload: {
  id: string;
  sku: string;
  name: string;
  comp?: Array<{ id?: string; sku?: string; qty?: number }>;
}): Promise<HttpResult<Item | null>> {
  const res = await http('PATCH', '/api/auth/items', payload);
  if (!res.ok) return res as HttpResult<any>;
  const item = (res.data as any)?.data ?? (res.data as any)?.item ?? null;
  return { ...res, data: item } as HttpResult<Item | null>;
}

export async function deleteItem(id: string): Promise<HttpResult<null>> {
  const res = await http('DELETE', '/api/auth/items', { id }, { delay: 15_000 });
  return res as HttpResult<null>;
}

export async function getUsers(
  page?: number,
  limit?: number,
  signal?: AbortSignal,
  all = false,
): Promise<HttpResult<User[]>> {
  // build query params
  const params: string[] = [];
  if (all) params.push('all=true');
  if (!all) {
    const p = page ?? 1;
    const l = limit ?? 20;
    params.push(`page=${encodeURIComponent(String(p))}`);
    params.push(`limit=${encodeURIComponent(String(l))}`);
  }
  const url = `/api/auth/users${params.length ? '?' + params.join('&') : ''}`;
  const res = await http('GET', url, undefined, { signal });
  if (!res.ok) return res as HttpResult<any>;
  const raw = (res.data as any)?.data ?? res.data;
  // server may return data as array or as { data, meta }
  const list: User[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const meta = (res.data as any)?.meta ?? null;
  return { ...res, data: list, meta } as any as HttpResult<User[]>;
}

export async function getUser(id: string, signal?: AbortSignal): Promise<HttpResult<User | null>> {
  const url = `/api/auth/users?id=${encodeURIComponent(id)}`;
  const res = await http('GET', url, undefined, { signal });
  if (!res.ok) return res as HttpResult<any>;
  const raw = (res.data as any)?.data ?? res.data ?? null;
  return { ...res, data: raw } as HttpResult<User | null>;
}

export async function getUserInventories(
  id: string,
  signal?: AbortSignal,
): Promise<HttpResult<Array<{ id: string; userId: string; itemId: string; units: number; item?: Item }>>> {
  const url = `/api/auth/users/${encodeURIComponent(id)}/inventories`;
  const res = await http('GET', url, undefined, { signal });
  if (!res.ok) return res as HttpResult<any>;
  const raw = (res.data as any)?.data ?? res.data ?? [];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return { ...res, data: list } as any;
}

export async function createUser(payload: {
  name: string;
  phone: string;
  password: string;
  roleId?: string | number | null;
}): Promise<HttpResult<User | null>> {
  const res = await http('POST', '/api/auth/users', payload);
  if (!res.ok) return res as HttpResult<any>;
  const user = (res.data as any)?.user ?? (res.data as any)?.data ?? null;
  return { ...res, data: user } as HttpResult<User | null>;
}

export async function updateUser(payload: {
  id?: string;
  name?: string;
  phone?: string;
  password?: string;
  roleId?: string | number | null;
}): Promise<HttpResult<User | null>> {
  const res = await http('PATCH', '/api/auth/users', payload);
  if (!res.ok) return res as HttpResult<any>;
  const user = (res.data as any)?.user ?? (res.data as any)?.data ?? null;
  return { ...res, data: user } as HttpResult<User | null>;
}

export async function deleteUser(id: string): Promise<HttpResult<null>> {
  const res = await http('DELETE', '/api/auth/users', { id });
  return res as HttpResult<null>;
}

export default {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getUsers,
  getUser,
  getUserInventories,
  createUser,
  updateUser,
  deleteUser,
  // transfers
  getTransfers,
  createTransfer,
  acceptTransfer,
  rejectTransfer,
  getBootstrap,
};

// то, что ты прислал
async function getTransfers(
  page?: number,
  _limit?: number,
  offset?: number,
  q?: string,
  status?: string,
  signal?: AbortSignal,
  extra?: { toUserId?: string; fromUserId?: string; userId?: string; mine?: 'to' | 'from' | 'any'; cursor?: string | null },
): Promise<HttpResult<Transaction[]> & { nextOffset?: number; nextCursor?: string | null; hasMore?: boolean }> {
  async function inner(
    page?: number,
    _limit?: number,
    offset?: number,
    q?: string,
    status?: string,
    signalInner?: AbortSignal,
  ) {
    const params: string[] = [];
    const useLimit = typeof _limit === 'number' && _limit > 0 ? _limit : 5;
    params.push(`limit=${encodeURIComponent(String(useLimit))}`);
    if (extra?.cursor) {
      params.push(`cursor=${encodeURIComponent(extra.cursor)}`);
    } else {
      if (typeof offset === 'number' && offset > 0) {
        params.push(`offset=${encodeURIComponent(String(offset))}`);
      } else if (typeof page === 'number' && page > 1) {
        params.push(`offset=${encodeURIComponent(String((page - 1) * useLimit))}`);
      }
    }
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (status && status !== 'all') params.push(`status=${encodeURIComponent(status)}`);
    if (extra?.toUserId) params.push(`toUserId=${encodeURIComponent(extra.toUserId)}`);
    if (extra?.fromUserId) params.push(`fromUserId=${encodeURIComponent(extra.fromUserId)}`);
    if (extra?.userId) params.push(`userId=${encodeURIComponent(extra.userId)}`);
    if (extra?.mine) params.push(`mine=${encodeURIComponent(extra.mine)}`);

    const url = `/api/auth/transfer${params.length ? '?' + params.join('&') : ''}`;
    const res = await http('GET', url, undefined, { signal: signalInner, delay: 10_000 });
    if (!res.ok) return res as any;

    const body = res.data as any; // { data, nextOffset, hasMore }
    const raw = body?.data ?? res.data ?? [];
    const list: Transaction[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

    return {
      ...res,
      data: list,
      nextOffset: body?.nextOffset, // backward compat
      nextCursor: body?.nextCursor ?? null,
      hasMore: body?.hasMore,
    } as any;
  }

  return inner(page, _limit, offset, q, status, signal);
}

async function createTransfer(
  payload: any,
  opts?: { light?: boolean },
): Promise<(HttpResult<Transaction[] | Transaction | null> & { inventoriesFrom?: any; inventoriesTo?: any; transferPlan?: any; snapshot?: any; mode?: string })> {
  const url = `/api/auth/transfer${opts?.light ? '?light=1' : ''}`;
  const res = await http('POST', url, payload);
  if (!res.ok) return res as any;
  const body = res.data as any;
  const raw = body?.data ?? res.data;
  const list: Transaction[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return {
    ...(res as any),
    data: list,
    inventoriesFrom: body?.inventoriesFrom,
    inventoriesTo: body?.inventoriesTo,
    transferPlan: body?.transferPlan,
    snapshot: body?.snapshot,
    mode: body?.mode,
  } as any;
}

async function acceptTransfer(transferId: string, userId: string): Promise<HttpResult<any>> {
  const res = await http('PATCH', '/api/auth/transfer', { transferId, userId });
  return res as HttpResult<any>;
}

async function rejectTransfer(transferId: string, userId: string): Promise<HttpResult<any>> {
  const res = await http('DELETE', '/api/auth/transfer', { transferId, userId });
  return res as HttpResult<any>;
}

async function getBootstrap(signal?: AbortSignal): Promise<HttpResult<any>> {
  const token = tokenStorage.get();
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const res = await http('GET', '/api/auth/bootstrap', undefined, { signal, headers });
  return res as HttpResult<any>;
}
