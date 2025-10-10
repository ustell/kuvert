type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpResult<T = any> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

type OptionsHttp = {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  delay?: number;
};

export default async function http<T>(
  method: Method,
  url: string,
  body?: any,
  opts: OptionsHttp = {},
): Promise<HttpResult<T>> {
  const { headers, credentials = 'include', signal, delay = 5000 } = opts;

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials,
    signal,
  };

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      init.body = body;
      delete (init.headers as Record<string, string>)['Content-Type'];
    } else {
      try {
        init.body = JSON.stringify(body);
      } catch (error) {
        return {
          ok: false,
          status: 500,
          data: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  let ac: AbortController | undefined;
  let timer: number | undefined;
  if (delay || !signal) {
    ac = new AbortController();
    init.signal = ac.signal;
    timer = setTimeout(() => ac?.abort, delay);
  }

  try {
    const res = await fetch(url, init);
    if (timer) {
      clearTimeout(timer);
    }
    const result: HttpResult = {
      ok: res.ok,
      status: res.status,
      data: null,
      error: null,
    };
    const ct = res.headers.get('Content-Type') ?? '';
    if (ct.includes('application/json')) {
      try {
        const parse = await res.json();
        result.data = parse;
      } catch (error) {
        result.error = 'Invalid JSON in res';
        return result;
      }
    } else {
      try {
        const parse = await res.text();
        result.data = (parse && (parse as unknown as T)) || null;
      } catch (error) {
        result.error = 'Invalid text in res';
        return result;
      }
    }

    if (!result.ok) {
      const bodyAny = result.data as any;
      const msg = (bodyAny && (bodyAny.error ?? bodyAny.message)) ?? `HTTP ${result.status}`;
      result.error = typeof msg === 'string' ? msg : JSON.stringify(msg);
    }
    return result;
  } catch (err: any) {
    // normalize abort
    if (err?.name === 'AbortError') {
      return { ok: false, status: 0, data: null, error: 'Request aborted' };
    }
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message ?? 'Network error',
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
