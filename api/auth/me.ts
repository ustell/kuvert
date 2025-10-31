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

    // берём токен либо из cookie, либо из Authorization: Bearer
    const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const token = parseCookie(req, cookieName) || bearer;
    if (!token) return res.status(401).json({ error: 'Не авторизован' });

    const user = await verifyToken(token);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });

    let role = null;
    let allowedRoleIds: string[] = [];

    // Получаем роль и правила только если у пользователя есть roleId
    if (user.roleId) {
      role = await prisma.role.findUnique({
        where: { id: user.roleId },
        select: {
          id: true,
          name: true,
          fromRules: { select: { toRoleId: true } },
        },
      });

      allowedRoleIds = (role?.fromRules ?? []).map((r) => r.toRoleId).filter(Boolean);
      
      // Логирование для отладки
      console.log('[ME] User:', user.id, 'Role:', role?.name, 'AllowedRoleIds:', allowedRoleIds);
    } else {
      console.log('[ME] User:', user.id, 'has no roleId');
    }

    let allowedTargets:
      | Array<{
          id: string;
          name: string;
          phone: string | null;
          roleId: string | null;
          role: { id: string; name: string } | null;
        }>
      | [] = [];

    if (allowedRoleIds.length > 0) {
      allowedTargets = await prisma.user.findMany({
        where: {
          isActive: true,
          id: { not: user.id },
          roleId: { in: allowedRoleIds },
        },
        orderBy: { name: 'asc' },
        take: 200,
        select: {
          id: true,
          name: true,
          phone: true,
          roleId: true,
          role: { select: { id: true, name: true } },
        },
      });
      console.log('[ME] Found allowedTargets:', allowedTargets.length);
    }


    return res.status(200).json({
      data: {
        user: {
          ...user,
          role: role ? { id: role.id, name: role.name } : null,
        },
        allowedTargets,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
