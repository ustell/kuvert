import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { parseCookie } from '../lib/cookies';
import { verifyToken } from '../lib/token';

export default async function bootstrap(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const cookieName = process.env.COOKIE_NAME || 'session';
    const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const token = parseCookie(req, cookieName) || bearer;
    if (!token) return res.status(401).json({ error: 'Не авторизован' });

    const user = await verifyToken(token);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });

    const role = user.roleId
      ? await prisma.role.findUnique({
          where: { id: user.roleId },
          select: { id: true, name: true, fromRules: { select: { toRoleId: true } } },
        })
      : null;
    const allowedRoleIds = (role?.fromRules ?? []).map((r) => r.toRoleId).filter(Boolean);

    const [inventories, minimalUsers, minimalItems, roles] = await Promise.all([
      prisma.inventory.findMany({
        where: { userId: user.id },
        select: { id: true, itemId: true, units: true, item: { select: { id: true, sku: true, name: true } } },
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, phone: true, roleId: true, role: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
        take: 200,
      }),
      prisma.item.findMany({ select: { id: true, sku: true, name: true }, orderBy: { name: 'asc' }, take: 200 }),
      prisma.role.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);

    return res.status(200).json({
      data: {
        me: { ...user, role: role ? { id: role.id, name: role.name } : (user as any).role ?? null, inventories },
        allowedTargets: allowedRoleIds.length
          ? await prisma.user.findMany({
              where: { isActive: true, id: { not: user.id }, roleId: { in: allowedRoleIds } },
              orderBy: { name: 'asc' },
              select: { id: true, name: true, phone: true, roleId: true, role: { select: { id: true, name: true } } },
            })
          : [],
        users: minimalUsers,
        items: minimalItems,
        roles,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


