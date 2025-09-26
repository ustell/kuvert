type method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export class HttpError extends Error {
    status: number
    body: any;

    constructor(message: string, status: number, body: any) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.body = body;
    }
}

export type HttpResult<T = any> = {
    ok: boolean;
    status: number;
    data?: T | null;
    error?: string | null;
};

type OptionsHttp = {
    Headers?: Record<string, string>,
    credentials?: RequestCredentials,
    signal?: AbortSignal,
    delay?: number
}


export default async function http<T>(
    method: method,
    url: string,
    body?: any,
    opts: OptionsHttp = {}
): Promise<HttpResult<T>> {
    const { Headers = {}, credentials = "include", signal, delay = 30_000 } = opts // передаются деф значения
    const init: RequestInit = {
        method: method,
        credentials: credentials,
        headers: {
            "Content-Type": "application/json",
            ...Headers
        },
        signal: signal,
    } // инициализируется и передаются значения которые уже есть
    if (body !== undefined && body !== null) {
        if (body instanceof FormData) { // не понимаю что такое instanceof и formdata
            init.body = body // передаем в init.body значение из body 
        }
        else {
            try {
                init.body = JSON.stringify(body); // передаем в init.body значение из body но уже через stringify
                (init.headers as Record<string, string>)['Content-Type'] = "application/json" // передаем в init.headers значение из body
            } catch (error) {
                return {
                    ok: false,
                    status: 500,
                    data: null,
                    error: "Failed to serialize request body"
                } // возвращаем ошибку
            }
        }
    }

    let ac: AbortController | undefined // типизируем переменную как abortcontroller
    let timeout: number | undefined // просто таймаут
    if (delay && !signal) { // если есть дилей который передан и сигнал не передан
        ac = new AbortController(); // инициализируем
        (init as any).signal = ac.signal; // передаем значение в init
        timeout = window.setTimeout(() => ac!.abort(), delay) // сработает аборт через переданный delay
    }

    try {
        const resp = await fetch(url, init)
        if (timeout) clearTimeout(timeout)
        const result: HttpResult<T> = {
            ok: resp.ok,
            status: resp.status,
            data: null,
            error: null
        }

        const ct = resp.headers.get("Content-Type") ?? ''

        if (ct.includes("application/json")) {
            try {
                const parse = await resp.json()
                result.data = parse
            } catch (error) {
                result.error = "Invalid JSON in resp"
                return result
            }
        } else {
            try {
                const parse = await resp.text()
                result.data = (parse && (parse as unknown as T)) || null
            } catch (error) {
                result.error = "Invalid text in resp"
                return result
            }
        }
        if (!resp.ok) {
            const bodyAny = result.data as any;
            const msg =
                (bodyAny && (bodyAny.error ?? bodyAny.message)) ??
                `HTTP ${resp.status}`;
            result.error = typeof msg === "string" ? msg : JSON.stringify(msg);
        }

        return result;

    } catch (err: any) {
        // normalize abort
        if (err?.name === "AbortError") {
            return { ok: false, status: 0, data: null, error: "Request aborted" };
        }
        return {
            ok: false,
            status: 0,
            data: null,
            error: err?.message ?? "Network error",
        };
    } finally {
        if (timeout) clearTimeout(timeout)
    }

}