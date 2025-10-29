import { VercelRequest as Q, VercelResponse as Res } from '@vercel/node';
import { prisma } from '../lib/prisma'; // поправь путь, если у тебя другой
import type { User as PrismaUser } from '@prisma/client';

export default async function users(req: Q, res: Res) {
  try {
    switch (req.method) {
      case 'GET': {
        const data = await prisma.user.findMany({
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
        });
        return res.status(200).json({ data });
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

        const user = await prisma.user.create({
          data: {
            name,
            phone,
            password, // в проде обязательно хешируй
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
          data.password = password; // в проде хешируй
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
