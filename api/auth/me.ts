// api/auth/me.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { parseCookie } from '../lib/cookies';
import { verifyToken } from '../lib/token';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cookieName = process.env.COOKIE_NAME || 'session';
    const token = parseCookie(req, cookieName);
    if (!token) return res.status(401).json({ error: 'Не авторизован' });

    // user со всем, что тебе нужно в UI
    const user = await verifyToken(token);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });

    // роль пользователя + кого он МОЖЕТ таргетить
    const role = await prisma.role.findUnique({
      where: { id: user.roleId! },
      select: {
        id: true,
        name: true,
        fromRules: { select: { toRoleId: true } }, // важное место
      },
    });

    const allowedRoleIds = (role?.fromRules ?? []).map((r) => r.toRoleId).filter(Boolean);

    let allowedTargets: Array<{
      id: string;
      name: string;
      phone: string | null;
      roleId: string | null;
      role: { id: string; name: string } | null;
    }> = [];

    if (allowedRoleIds.length) {
      allowedTargets = await prisma.user.findMany({
        where: {
          isActive: true,
          id: { not: user.id },
          roleId: { in: allowedRoleIds },
        },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          phone: true,
          roleId: true,
          role: { select: { id: true, name: true } },
        },
      });
    }

    // можно добавить поле прямо в ответ, не ломая старый формат:
    return res.status(200).json({
      data: {
        user: {
          ...user,
          role: role ? { id: role.id, name: role.name } : user.role, // чтобы точно было
        },
        allowedTargets, // ← вот оно
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
