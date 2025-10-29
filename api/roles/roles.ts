import { VercelRequest as Q, VercelResponse as Res } from '@vercel/node';
import { prisma } from '../lib/prisma';

export default async function roles(req: Q, res: Res) {
  try {
    if (req.method !== 'GET') return res.status(404).json({ error: 'Method Not Found' });

    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(roles);
  } catch (e: any) {
    console.error('GET /api/auth/roles failed:', e?.message || e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
