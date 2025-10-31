import { errText } from './api';
import type { HttpResult } from './http';

export function formatError(
  res: HttpResult<any> | { status?: number; error?: string } | null | undefined,
): string {
  if (!res) return 'Неизвестная ошибка';
  // If shape is HttpResult
  if ((res as any).status !== undefined || (res as any).error !== undefined) {
    return errText({ status: (res as any).status, error: (res as any).error });
  }
  return String((res as any).error ?? 'Ошибка');
}

export function extractMessages(res: any, fallback = 'Произошла ошибка'): string[] {
  if (!res) return [fallback];
  if (Array.isArray(res?.issues)) return res.issues.map((i: any) => i?.message ?? String(i));
  const m = res?.errorBody ?? res?.data ?? res?.error ?? res?.message ?? null;
  if (!m) return [fallback];
  if (typeof m === 'string') return [m];
  try {
    return [JSON.stringify(m)];
  } catch {
    return [String(m)];
  }
}

export default { formatError, extractMessages };
