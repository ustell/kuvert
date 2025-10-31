export function useConfirmDelete(message = 'Удалить запись? Это действие необратимо.') {
  return async () => window.confirm(message);
}
