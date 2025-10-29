// Универсальная нормализация и форматирование причин отказа (issues/errors)
export type RawIssue = any;

export type FormattedIssues = {
  title: string; // короткий заголовок
  lines: string[]; // пункты для списка в UI
  code?: string; // machine-friendly код (если был)
};

// Позволяет подставить имена сущностей по id (товары/компоненты)
export type NameLookup = (id?: string) => string | undefined;

/** забираем массив причин из различных форматов ответа */
export function extractIssues(raw: any): RawIssue[] {
  if (!raw) return [];
  const data = raw.data ?? raw;
  if (Array.isArray(data?.errors)) return data.errors as RawIssue[];
  if (Array.isArray(data?.issues)) return data.issues as RawIssue[];
  if (Array.isArray(raw.errors)) return raw.errors as RawIssue[];
  if (Array.isArray(raw.issues)) return raw.issues as RawIssue[];
  return [];
}

/** короткий текст по HTTP коду */
export function msgByHttp(code?: number, fallback?: string) {
  if (!code) return fallback ?? 'Произошла ошибка';
  if (code === 401 || code === 403) return 'Недостаточно прав или истекла сессия';
  if (code === 422) return 'Проверьте корректность полей';
  if (code >= 500) return 'Сервер временно недоступен';
  return fallback ?? `Ошибка (HTTP ${code})`;
}

/** человеко-читаемое форматирование распространённых ошибок склада/переводов */
export function formatIssues(issues: RawIssue[], nameOf?: NameLookup): FormattedIssues {
  if (!Array.isArray(issues) || issues.length === 0) {
    return { title: 'Не удалось выполнить операцию', lines: [] };
  }

  const i = issues[0];
  const status = String(i.status ?? i.code ?? '').toUpperCase();
  const title = i.message ?? (status ? `Операция отклонена (${status})` : 'Операция отклонена');

  const d = i.details ?? {};
  const lines: string[] = [];

  // Кейс «склад/комплектация»
  if ('requestedQty' in d || 'availableReady' in d || 'needToCraft' in d) {
    if (d.requestedQty != null) lines.push(`Запрошено: ${d.requestedQty}`);
    if (d.availableReady != null) lines.push(`Готово на складе: ${d.availableReady}`);
    if (d.needToCraft != null) lines.push(`Нужно произвести: ${d.needToCraft}`);
  }

  // Недостающие компоненты (если есть)
  const comps = d.components ?? d.missing ?? [];
  if (Array.isArray(comps) && comps.length) {
    lines.push('Не хватает компонентов:');
    for (const c of comps) {
      const compId = String(c.componentId ?? c.id ?? '');
      const name = nameOf?.(compId) ?? c.name ?? `#${compId}`;
      const required = Number(c.required ?? 0);
      const available = Number(c.available ?? 0);
      const lack = c.lack != null ? Number(c.lack) : Math.max(0, required - available);
      lines.push(`• ${name}: нужно ${required}, есть ${available}, нехватает ${lack}`);
    }
  }

  // Валидационные ошибки
  if (Array.isArray(i.fields)) {
    for (const f of i.fields) {
      if (f?.path && f?.message) lines.push(`• ${f.path}: ${f.message}`);
    }
  }

  // Фолбэк — если ничего не распознали, покажем текст
  if (!lines.length && typeof i === 'object') {
    const txt = i.message ?? i.detail ?? i.description ?? null;
    if (txt) lines.push(String(txt));
  }

  return { title, lines, code: status || undefined };
}
