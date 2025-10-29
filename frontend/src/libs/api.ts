export type HttpList<T> = { data?: T[] | { items: T[] } } | { items: T[] } | T[] | any;

export function unwrapList<T>(raw: HttpList<T>): T[] {
  const data = raw?.data ?? raw;
  const items = data?.items ?? data;
  return Array.isArray(items) ? items : [];
}

export function unwrapOne<T>(raw: any): T | null {
  const data = raw?.data ?? raw;
  return data?.user ?? data ?? null;
}

export function errText(res: { status?: number; error?: string }) {
  const { status, error } = res;
  if (status === 401 || status === 403) return 'Неверные учетные данные';
  if (status === 422) return 'Проверьте поля формы';
  if ((status ?? 0) >= 500) return 'Сервер временно недоступен';
  return error ?? (status ? `HTTP ${status}` : 'Ошибка сети');
}
