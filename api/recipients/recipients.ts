import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { parseCookie } from '../lib/cookies';
import { verifyToken } from '../lib/token';

/**
 * GET /api/recipients
 * Возвращает пользователей, которым текущий пользователь (по токену) может передавать товары.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const cookieName = process.env.COOKIE_NAME || 'session';
    const token = parseCookie(req, cookieName);
    if (!token) return res.status(401).json({ error: 'Не авторизован' });

    const me = await verifyToken(token); // должен вернуть user с id
    if (!me?.id) return res.status(401).json({ error: 'Пользователь не найден' });

    // достаём роль текущего пользователя
    const fromUser = await prisma.user.findUnique({
      where: { id: me.id },
      select: { id: true, roleId: true },
    });
    if (!fromUser?.roleId) return res.status(200).json({ users: [] });

    // какие роли ему разрешено "кому"
    const allowedRules = await prisma.roleRule.findMany({
      where: { fromRoleId: fromUser.roleId },
      select: { toRoleId: true },
    });
    const toRoleIds = allowedRules.map((r) => r.toRoleId);
    if (toRoleIds.length === 0) return res.status(200).json({ users: [] });

    const recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: fromUser.id },
        roleId: { in: toRoleIds },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        roleId: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ users: recipients });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
