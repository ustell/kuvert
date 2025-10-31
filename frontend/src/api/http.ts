// Этот файл оставлен для обратной совместимости. Проект использует `src/libs/http.ts` —
// собственную обёртку на fetch. Если вы уверены, что `src/api/http.ts` не используется,
// можете удалить файл и зависимость `axios` из package.json.

import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});
