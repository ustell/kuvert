const NS = (import.meta.env.VITE_LS_NS as string) || 'app:'; // префикс в LS

function keyOf(key: string) { return `${key}` }


/**
 * Возвращает значение из локального хранилища по ключу key.
 * Если значе не найдено, возвращает fallback.
 * @template T - тип значения, которое будет возвращено.
 * @param {string} key - ключ, по которому будет возвращено значение.
 * @param {T | null} fallback - значение, которое будет возвращено, если по ключу key не будет найдено значение.
 * @returns {T | null} - значение из локального хранилища или fallback, если значение не найдено.
 */
export function lsGet<T>(key: string, fallback: T | null = null): T | null {
    const raw = localStorage.getItem(keyOf(key));
    if (raw == null) return fallback;
    try { return JSON.parse(raw) as T } catch { return fallback }
}
/**
 * Записывает значение value в локальное хранилище по ключу key.
 * @param {string} key - ключ, по которому будет записано значение.
 * @param {T} value - значение, которое будет записано.
 */

export function lsSet<T>(key: string, value: T): void {
    localStorage.setItem(keyOf(key), JSON.stringify(value));
}

/**
 * Удаляет элемент из локального хранилища по заданному ключу.
 * @param {string} key - ключ элемента, который нужно удалить.
 */
export function lsRemove(key: string): void {
    localStorage.removeItem(keyOf(key));
}

// Удобный апдейтер: читает -> применяет функцию -> пишет
export function lsUpdate<T>(key: string, updater: (prev: T | null) => T): T {
    const next = updater(lsGet<T>(key));
    lsSet<T>(key, next);
    return next;
}
