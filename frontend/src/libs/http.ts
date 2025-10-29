// libs/http.ts
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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

export default async function http<T>(
  method: Method,
  url: string,
  body?: any,
  opts: OptionsHttp = {},
): Promise<HttpResult<T>> {
  const { headers, Headers, credentials = 'include', signal: extSignal } = opts;
  // backward compatible timeout option names
  const delay = opts.delay ?? (opts as any).timeoutMs ?? (opts as any).timeout ?? 10000;

  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers ?? {}),
    ...(Headers ?? {}),
  };

  // комбинируем внешний сигнал и таймаут
  const ac = new AbortController();
  const onExtAbort = () => ac.abort(extSignal?.reason ?? new DOMException('Aborted', 'AbortError'));
  if (extSignal) {
    if (extSignal.aborted) {
      ac.abort(extSignal.reason ?? new DOMException('Aborted', 'AbortError'));
    } else {
      extSignal.addEventListener('abort', onExtAbort, { once: true });
    }
  }
  const timer = delay! > 0 ? setTimeout(() => ac.abort(), delay) : undefined;

  const init: RequestInit = {
    method,
    headers: mergedHeaders,
    credentials,
    signal: ac.signal,
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
    if (timer) clearTimeout(timer as any);
    if (extSignal) extSignal.removeEventListener('abort', onExtAbort as any);
  }

  try {
    const res = await fetch(url, init);
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
    if (err?.name === 'AbortError') {
      return { ok: false, status: 0, data: null, error: 'Request aborted' };
    }
    return { ok: false, status: 0, data: null, error: err?.message ?? 'Network error' };
  }
}
