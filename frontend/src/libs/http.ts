// libs/http.ts
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
import { tokenStorage } from './token';

export type HttpResult<T = any> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

export type OptionsHttp = {
  headers?: Record<string, string>;
  Headers?: Record<string, string>; // совместимость со старым кодом
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  // таймаут (мс). Поддерживаем несколько имён для совместимости: `delay`, `timeoutMs`, `timeout`
  delay?: number;
  timeoutMs?: number;
  timeout?: number;
};

// In-flight GET coalescing cache
const inflight = new Map<string, Promise<HttpResult<any>>>();

export default async function http<T>(
  method: Method,
  url: string,
  body?: any,
  opts: OptionsHttp = {},
): Promise<HttpResult<T>> {
  const { headers, Headers, credentials = 'include' } = opts;

  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers ?? {}),
    ...(Headers ?? {}),
  };
  // inject Authorization from tokenStorage if not provided
  if (!mergedHeaders['Authorization']) {
    const tk = tokenStorage.get();
    if (tk) mergedHeaders['Authorization'] = `Bearer ${tk}`;
  }

  const init: RequestInit = {
    method,
    headers: mergedHeaders,
    credentials,
  };

  if (body !== undefined && body !== null) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      init.body = body;
      delete (init.headers as Record<string, string>)['Content-Type']; // boundary проставит браузер
    } else {
      try {
        init.body = JSON.stringify(body);
      } catch (error) {
        cleanup();
        return {
          ok: false,
          status: 0,
          data: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  function cleanup() {
    /* no-op: abort/timeout disabled */
  }

  try {
    // Build final URL.
    // If VITE_API_URL is provided, prefix it (avoid double /api).
    // Otherwise, keep relative `/api/...` so Vite dev proxy handles it (no CORS in dev).
    const apiEnv = ((import.meta as any).env?.VITE_API_URL as string | undefined) || undefined;
    let finalUrl = url;
    if (url.startsWith('/api/')) {
      if (apiEnv && typeof apiEnv === 'string' && apiEnv.trim().length) {
        const baseNoSlash = apiEnv.replace(/\/$/, '');
        const baseHasApi = /\/api$/i.test(baseNoSlash);
        finalUrl = baseHasApi ? `${baseNoSlash}${url.replace(/^\/api/, '')}` : `${baseNoSlash}${url}`;
      } else {
        // keep as relative to leverage Vite proxy
        finalUrl = url;
      }
    }
    // Coalesce identical concurrent GETs (no body)
    const makeKey = () => `${method} ${finalUrl} ${JSON.stringify(init.headers ?? {})}`;
    const canCoalesce = method === 'GET' && (body === undefined || body === null);

    if (canCoalesce) {
      const key = makeKey();
      const existing = inflight.get(key);
      if (existing) return (await existing) as HttpResult<T>;
      const p = (async () => {
        const res = await fetch(finalUrl, init);
        const result: HttpResult<T> = { ok: res.ok, status: res.status, data: null as any, error: null };
        if (res.status !== 204 && res.status !== 205) {
          const ct = (res.headers.get('Content-Type') ?? '').toLowerCase();
          try {
            if (ct.includes('application/json')) result.data = (await res.json()) as any as T;
            else {
              const text = await res.text();
              result.data = (text?.length ? (text as unknown as T) : null) as any;
            }
          } catch {
            result.data = null as any;
          }
        }
        if (!result.ok) {
          const b: any = result.data;
          const msg = b?.error ?? b?.message ?? b?.errors?.[0] ?? (typeof b === 'string' ? b : null) ?? `HTTP ${result.status}`;
          result.error = typeof msg === 'string' ? msg : JSON.stringify(msg);
        }
        return result;
      })();
      inflight.set(key, p);
      try {
        const out = await p;
        return out as HttpResult<T>;
      } finally {
        inflight.delete(key);
        cleanup();
      }
    }

    const res = await fetch(finalUrl, init);
    cleanup();

    const result: HttpResult<T> = { ok: res.ok, status: res.status, data: null, error: null };

    // нет контента — и это ок
    if (res.status === 204 || res.status === 205) return result;

    const ct = (res.headers.get('Content-Type') ?? '').toLowerCase();
    try {
      if (ct.includes('application/json')) {
        result.data = (await res.json()) as T;
      } else {
        const text = await res.text();
        result.data = text?.length ? (text as unknown as T) : null;
      }
    } catch {
      result.data = null; // пустое тело — не ошибка
    }

    if (!result.ok) {
      const b: any = result.data;
      const msg =
        b?.error ??
        b?.message ??
        b?.errors?.[0] ??
        (typeof b === 'string' ? b : null) ??
        `HTTP ${result.status}`;
      result.error = typeof msg === 'string' ? msg : JSON.stringify(msg);
    }
    return result;
  } catch (err: any) {
    cleanup();
    return { ok: false, status: 0, data: null, error: err?.message ?? 'Network error' };
  }
}
