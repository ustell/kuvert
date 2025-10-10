import { httpGet, httpPost, setAuthToken } from './https';
import { lsGet, lsSet, lsRemove } from './storage';

export type User = { id: string; phone: string; name: string; role?: string };
export type LoginOk = { user: User; token?: string };
export type MeOk = { user: User | null };

// Ключ в LS, если используешь JWT
const TOKEN_KEY = 'auth:token';

// Восстанавливаем токен при загрузке приложения (импортируй модуль в main.ts один раз)
const existing = lsGet<string>(TOKEN_KEY);
if (existing) setAuthToken(existing);

export async function login(phone: string, password: string): Promise<User> {
    const res = await httpPost<LoginOk>('/api/auth/login', { phone, password }, {
        auth: 'cookie', // если у тебя cookie-сессии; поменяй на 'token' при JWT
        timeoutMs: 15000,
    });

    if (res.token) {
        setAuthToken(res.token);
        lsSet(TOKEN_KEY, res.token);
    }
    return res.user;
}

export async function me(): Promise<User | null> {
    const res = await httpGet<MeOk>('/api/auth/me', { auth: 'cookie' /* или 'token' */ });
    return res.user ?? null;
}

export async function logout(): Promise<void> {
    try {
        await httpPost('/api/auth/logout', undefined, { auth: 'cookie' /* или 'token' */ });
    } catch { /* не критично, продолжим очистку локально */ }
    setAuthToken(null);
    lsRemove(TOKEN_KEY);
}
