import type { Method } from './http';
import http from './http';
type url = 'users' | 'item' | 'recipes' | 'transfer';
export async function getManyList<T>(
  url: url,
  opts?: {
    method?: Method;
    signal?: AbortSignal;
  },
): Promise<{ ok: boolean; body?: T; error?: string }> {
  const method = opts?.method ?? 'GET';

  const res = await http<T>(method, `/api/auth/${url}`, undefined, { signal: opts?.signal });
  if (!res.ok) {
    return { ok: false, error: res.error ?? `HTTP ${res.status}` };
  }

  if (!res.data) {
    return { ok: false, error: res.error ?? `HTTP ${res.status}` };
  }

  return { ok: true, body: res.data };
}

export async function Create(url: url, body: object) {
  const res = await http('POST', `/api/auth/${url}`, body);
  if (!res.ok) {
    return { ok: false, error: res.error ?? `HTTP ${res.status}` };
  }
  return { ok: true, body: res.data };
}
