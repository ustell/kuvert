import { ApiError, normalizeError, TimeoutError } from './errors';
import type { ApiErrorPayload } from './errors'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpOptions = {
    method?: HttpMethod;
    headers?: Record<string, string>;
    // Тело может быть объектом (JSON), строкой или FormData
    body?: any;
    // Query-параметры
    query?: Record<string, string | number | boolean | undefined | null>;
    // Аутентификация: cookie-сессия или токен
    auth?: 'cookie' | 'token' | 'none';
    // Пользовательский таймаут
    timeoutMs?: number;
};

// Храним токен в памяти модуля (если используешь JWT)
let authToken: string | null = null;
export function setAuthToken(token: string | null) { authToken = token }

const BASE_URL = (import.meta.env.VITE_API_URL as string) || ''; // если пусто — используем относительные пути


function buildUrl(path: string, query?: HttpOptions['query']) {
    const url = new URL(path, BASE_URL || window.location.origin);
    if (query) {
        Object.entries(query).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            url.searchParams.set(k, String(v));
        });
    }
    return url.toString();
}
/**
 * Парсит ответ сервера в зависимости от контент-типа
 * @returns {Promise<any>} - разобранный ответ сервера
 */

async function parseResponse(res: Response): Promise<any> {
    if (res.status === 204) return null;
    const ctype = res.headers.get('content-type') ?? '';
    if (ctype.includes('application/json')) {
        return await res.json();
    }
    return await res.text(); // на всякий
}

/**
 * Метод для отправки HTTP-запроса.
 * @param {string} path - путь до API
 * @param {HttpOptions} opts - опции запроса:
 *   - method: метод запроса (GET, POST, PUT, PATCH, DELETE)
 *   - headers: заголовки запроса
 *   - body: тело запроса (JSON, FormData, Blob)
 *   - query: query-параметры
 *   - auth: аутентификация (cookie, token, none)
 *   - timeoutMs: пользовательский таймаут (мс)
 * @returns {Promise<T>} - результат запроса (JSON, string, Blob)
 * @throws {ApiError} - ошибка запроса
 * @throws {TimeoutError} - таймаут запроса
 */
export async function http<T = any>(path: string, opts: HttpOptions = {}): Promise<T> {
    const {
        method = 'GET',
        headers = {},
        body,
        query,
        auth = 'none',
        timeoutMs = 15000,
    } = opts;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const url = buildUrl(path, query);

    // Если тело — FormData, заголовок Content-Type ставить не нужно (браузер проставит boundary сам)
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    const reqHeaders: Record<string, string> = {
        Accept: 'application/json',
        ...headers,
    };

    if (!isFormData && body !== undefined && !(body instanceof Blob)) {
        reqHeaders['Content-Type'] = reqHeaders['Content-Type'] ?? 'application/json';
    }

    // Аутентификация
    const fetchInit: RequestInit = {
        method,
        headers: reqHeaders,
        signal: controller.signal,
    };

    if (auth === 'cookie') {
        fetchInit.credentials = 'include';
    } else if (auth === 'token' && authToken) {
        reqHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    if (body !== undefined) {
        fetchInit.body = isFormData || body instanceof Blob ? body : JSON.stringify(body);
    }

    try {
        const res = await fetch(url, fetchInit);
        clearTimeout(timeout);

        const data = await parseResponse(res);

        if (!res.ok) {
            // Пытаемся вытащить message/code из ответа
            let msg = `HTTP ${res.status}`;
            let code: string | undefined;
            let details: unknown;

            if (data && typeof data === 'object') {
                const payload = data as ApiErrorPayload;
                msg = payload.message || payload.error || msg;
                code = payload.code;
                details = payload.details ?? payload;
            }

            throw new ApiError(msg, res.status, code, details);
        }

        return data as T;
    } catch (err) {
        const n = normalizeError(err);
        if (n instanceof TimeoutError) {
            throw new TimeoutError(`Таймаут запроса ${method} ${path}`, n.cause);
        }
        throw n;
    } finally {
        clearTimeout(timeout);
    }
}

// Удобные шорткаты
export const httpGet = <T = any>(p: string, o: Omit<HttpOptions, 'method' | 'body'> = {}) => http<T>(p, { ...o, method: 'GET' });
export const httpPost = <T = any>(p: string, body?: any, o: Omit<HttpOptions, 'method' | 'body'> = {}) => http<T>(p, { ...o, method: 'POST', body });
export const httpPatch = <T = any>(p: string, body?: any, o: Omit<HttpOptions, 'method' | 'body'> = {}) => http<T>(p, { ...o, method: 'PATCH', body });
export const httpPut = <T = any>(p: string, body?: any, o: Omit<HttpOptions, 'method' | 'body'> = {}) => http<T>(p, { ...o, method: 'PUT', body });
export const httpDel = <T = any>(p: string, o: Omit<HttpOptions, 'method' | 'body'> = {}) => http<T>(p, { ...o, method: 'DELETE' });
