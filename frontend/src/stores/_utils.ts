// stores/_utils.ts
export const TTL = { short: 30_000, medium: 60_000, long: 5 * 60_000 } as const;
export const now = () => Date.now();
export const isFresh = (ts: number | null, ttl: number) => ts != null && now() - ts < ttl;

// гонки запросов
export const nextSeq = (s: { _reqSeq: number }) => ++s._reqSeq;
export const isLatest = (s: { _reqSeq: number }, seq: number) => s._reqSeq === seq;

// NOTE: unwrapList is provided centrally in `src/libs/api.ts`.
// Keep other store helpers here (TTL, seq, array helpers, withLoading).

// операции над массивами по id
export const upsertById = <T extends { id: any }>(xs: T[], item: T) => {
  const i = xs.findIndex((x) => String(x.id) === String(item.id));
  return i === -1 ? [item, ...xs] : [...xs.slice(0, i), { ...xs[i], ...item }, ...xs.slice(i + 1)];
};
export const removeById = <T extends { id: any }>(xs: T[], id: any) =>
  xs.filter((x) => String(x.id) !== String(id));

// маленькая обёртка загрузки
export async function withLoading<T extends { loading: boolean }>(
  store: T,
  run: () => Promise<any>,
) {
  store.loading = true;
  try {
    return await run();
  } finally {
    store.loading = false;
  }
}
