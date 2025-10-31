export function useFormat(locale = 'ru-RU') {
  const date = (d?: string | Date) =>
    d
      ? new Intl.DateTimeFormat(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(d))
      : '—';
  const units = (n?: number) => `${Number(n ?? 0)} шт.`;
  const number = (n?: number) => new Intl.NumberFormat(locale).format(Number(n ?? 0));
  return { date, units, number };
}
