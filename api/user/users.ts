import { VercelRequest as Q, VercelResponse as Res } from '@vercel/node';
import { prisma } from '../lib/prisma'; // поправь путь, если у тебя другой
import type { User as PrismaUser } from '@prisma/client';
import bcrypt from 'bcryptjs';

export default async function users(req: Q, res: Res) {
  try {
    switch (req.method) {
      case 'GET': {
        // support pagination via query params: ?page=1&limit=20
        // special flag `all=true` will return all results (keeps backward compatibility when needed)
        const q: any = (req as any).query ?? {};
        const id = q.id ?? null;
        const rawLimit = q.limit ?? null;
        const rawPage = q.page ?? null;
        // default: if no explicit pagination params are provided, return all users
        const all = q.all === 'true' || (rawLimit === null && rawPage === null);
        const page = Math.max(1, parseInt(String(q.page || '1'), 10) || 1);
        const limit = rawLimit ? Math.max(1, parseInt(String(rawLimit), 10) || 20) : null;

        // if id provided -> return single user with role
        if (id) {
          const user = await prisma.user.findUnique({
            where: { id },
            select: {
              id: true,
              name: true,
              phone: true,
              isActive: true,
              createdAt: true,
              roleId: true,
              role: { select: { id: true, name: true } },
            },
          });
          if (!user) return res.status(404).json({ error: 'User not found' });
          return res.status(200).json({ data: user });
        }

        const baseFindArgs = {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            phone: true,
            isActive: true,
            createdAt: true,
            roleId: true,
            role: { select: { id: true, name: true } },
          },
        } as any;

        if (all || limit === null) {
          const data = await prisma.user.findMany(baseFindArgs);
          // avoid separate count() to speed up response
          return res
            .status(200)
            .json({ data, meta: { total: data.length, page: 1, limit: data.length } });
        }

        // paginated path (limit provided)
        const skip = (page - 1) * (limit as number);
        const data = await prisma.user.findMany({ ...baseFindArgs, skip, take: limit as number });
        // do not call count() here — client can infer hasMore from returned length
        return res.status(200).json({ data, meta: { page, limit } });
      }

      case 'POST': {
        const { name, phone, password, roleId } = req.body as {
          name: string;
          phone: string;
          password: string;
          roleId?: string | null;
        };

        if (!name || !phone || !password) {
          return res.status(400).json({ error: 'name, phone and password are required' });
        }

        // hash password before save so bcrypt.compare in login works
        const hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
          data: {
            name,
            phone,
            password: hash, // store hashed password
            ...(roleId ? { role: { connect: { id: roleId } } } : {}),
          },
          select: {
            id: true,
            name: true,
            phone: true,
            isActive: true,
            createdAt: true,
            roleId: true,
            role: { select: { id: true, name: true } },
          },
        });

        return res.status(201).json({ user });
      }

      case 'PATCH': {
        const { id, name, phone, password, roleId } = req.body as {
          id: string;
          name?: string;
          phone?: string;
          password?: string; // пустая строка — не менять
          roleId?: string | null; // null/'' => снять роль
        };

        if (!id) return res.status(400).json({ error: 'id is required' });

        const data: Partial<PrismaUser> & { role?: any } = {};
        if (name) data.name = name;
        if (phone) data.phone = phone;
        if (password) {
          // re-hash new password when provided
          data.password = await bcrypt.hash(password, 10);
        }
        if (roleId !== undefined) {
          data.role = roleId ? { connect: { id: roleId } } : { disconnect: true };
        }

        const user = await prisma.user.update({
          where: { id },
          data,
          select: {
            id: true,
            name: true,
            phone: true,
            isActive: true,
            createdAt: true,
            roleId: true,
            role: { select: { id: true, name: true } },
          },
        });

        return res.status(200).json({ user });
      }

      case 'DELETE': {
        const { id } = req.body as { id?: string };
        if (!id) return res.status(400).json({ error: 'id is required' });

        const user = await prisma.user.update({
          where: { id },
          data: { isActive: false },
          select: { id: true, isActive: true },
        });

        return res.status(200).json({ user });
      }

      default:
        return res.status(404).json({ error: 'Method Not Found' });
    }
  } catch (error: any) {
    console.error(`API /api/auth/users ${req.method} failed:`, error?.message || error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
