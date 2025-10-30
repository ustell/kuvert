// auth.ts
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import { prisma } from './prisma';
import { VercelResponse } from '@vercel/node';

/**
 * Верифицирует токен JWT и возвращает пользователя, если токен валиден.
 * Если AUTH_SECRET не установлен, то бросает ошибку.
 * Если токен не валиден, то возвращает null.
 * @param {string} token - токен JWT
 * @returns {Promise<{id: string, phone: string, name: string}> | null | Promise<null>}
 */
export const verifyToken = async (token: string) => {
  const secretString = process.env.AUTH_SECRET;
  if (!secretString) {
    throw new Error('AUTH_SECRET is not set');
  }
  const secret = new TextEncoder().encode(secretString);

  try {
    const { payload } = await jwtVerify(token, secret);
    // payload может содержать uid или sub — подстрахуемся
    const uid = (payload as any).uid ?? (payload as any).sub;
    if (!uid) return null;

    // Fetch only minimal user fields here to keep token verification fast.
    // Avoid heavy relational includes (inventories/recipes) which slow down the request.
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, name: true, phone: true, roleId: true },
    });

    return user ?? null;
  } catch (err) {
    return null;
  }
};

/**
 * Создает токен JWT для пользователя и возвращает строку cookie.
 * Токен будет содержать uid пользователя и будет валиден в течении времени, установленном в переменной окружения COOKIE_MAX_DAYS.
 * Если AUTH_SECRET не установлен, то бросает ошибку.
 * @param {object} user - пользователь, для которого создается токен
 * @returns {Promise<string>} - строка cookie
 */
export async function createToken(res: VercelResponse, user: { id: string }) {
  return token;
}
