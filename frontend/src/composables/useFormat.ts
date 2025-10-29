export function useFormat(locale = 'ru-RU') {
  const date = (d?: string | Date) => (d ? new Date(d).toLocaleDateString(locale) : '—');
  const units = (n?: number) => `${Number(n ?? 0)} шт.`;
  const number = (n?: number) => new Intl.NumberFormat(locale).format(Number(n ?? 0));
  return { date, units, number };
}
