// libs/token.ts
// middle-grade token storage for access tokens (TypeScript)

type StorageLike = {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
};

export type TokenPayload = Record<string, any> | null;

const DEFAULT_KEY = "Sessions";

/**
 * Safe base64-url decoder for JWT payload
 */
function base64UrlDecode(input: string): string {
    // Replace URL-safe characters and pad with '='
    input = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = input.length % 4;
    if (pad === 2) input += "==";
    else if (pad === 3) input += "=";
    else if (pad !== 0) {
        // pad === 1 is invalid base64
        throw new Error("Invalid base64 string");
    }
    // atob can throw; caller should catch
    return atob(input);
}

/**
 * Decode JWT payload; returns null on invalid token.
 */
export function decodeJwtPayload(token: string | null): TokenPayload {
    if (!token) return null;
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const payloadRaw = parts[1] as string; // Add type assertion here
        if (!payloadRaw) return null; // Add type guard here
        const json = base64UrlDecode(payloadRaw);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * TokenStorage implementation:
 * - prefers localStorage (if available)
 * - falls back to in-memory object (useful for SSR/tests)
 *
 * API:
 * - set(token: string | null)
 * - get(): string | null
 * - clear()
 * - has(): boolean
 * - getPayload(): TokenPayload
 */
export const tokenStorage = (function create() {
    let inMemory: string | null = null;

    // detect localStorage availability (may throw in some browsers / sandboxed if blocked)
    function getLocalStorage(): StorageLike | null {
        try {
            if (typeof window === "undefined" || typeof window.localStorage === "undefined")
                return null;
            // feature test (might throw in some environments)
            const testKey = "__tk_test";
            window.localStorage.setItem(testKey, "1");
            window.localStorage.removeItem(testKey);
            return window.localStorage;
        } catch {
            return null;
        }
    }

    const storage = getLocalStorage();

    function set(token: string | null, key = DEFAULT_KEY) {
        if (!token) {
            // clear on null
            clear(key);
            return;
        }
        if (storage) {
            storage.setItem(key, token);
        } else {
            inMemory = token;
        }
    }

    function get(key = DEFAULT_KEY): string | null {
        if (storage) {
            return storage.getItem(key);
        } else {
            return inMemory;
        }
    }

    function clear(key = DEFAULT_KEY) {
        if (storage) {
            storage.removeItem(key);
        } else {
            inMemory = null;
        }
    }

    function has(key = DEFAULT_KEY): boolean {
        return !!get(key);
    }

    function getPayload(key = DEFAULT_KEY): TokenPayload {
        const t = get(key);
        return decodeJwtPayload(t);
    }

    return {
        set,
        get,
        clear,
        has,
        getPayload,
    } as const;
})();
