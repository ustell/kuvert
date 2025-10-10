import { tokenStorage } from "./token.ts";

export class ApiError extends Error {
    public status: number;
    public data?: any;
    constructor(message: string, status = 500, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

type RequestOptions = {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    /** ms */
    timeout?: number;
    /** pass-through fetch AbortSignal */
    signal?: AbortSignal | null;
    /** if true, don't include Authorization header even if token exists */
    skipAuth?: boolean;
};

const DEFAULT_TIMEOUT = 10000; // 10s
const baseUrl = "";


export async function request<T = any>(url: string, opts: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = opts.timeout ?? DEFAULT_TIMEOUT;

    const signal = opts.signal ?? null;
    const internalSignal = controller.signal;

    if (signal) {
        signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(opts.headers ?? {}),
        };

        if (!opts.skipAuth) {
            const token = tokenStorage("auth").get();
            if (token) headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch((baseUrl || "") + url, {
            method: opts.method ?? (opts.body ? "POST" : "GET"),
            headers,
            body: opts.body ? JSON.stringify(opts.body) : undefined,
            signal: internalSignal,
        });

        // 204 No Content
        if (res.status === 204) {
            return undefined as unknown as T;
        }

        const text = await res.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text; // fallback to raw text
        }

        if (!res.ok) {
            // prefer server message if exists
            const message = data?.error ?? data?.message ?? res.statusText;
            throw new ApiError(message || "Request failed", res.status, data);
        }

        return data as T;
    } catch (err: any) {
        if (err.name === "AbortError") throw new ApiError("Request timed out or aborted", 0);
        if (err instanceof ApiError) throw err;
        throw new ApiError(err?.message ?? "Network error", 0);
    } finally {
        clearTimeout(timer);
    }
}
