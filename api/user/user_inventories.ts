import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';

export default async function userInventories(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
    const id = (req.query.id as string) || (req as any).params?.id;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const inventories = await prisma.inventory.findMany({
      where: { userId: id },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        userId: true,
        itemId: true,
        units: true,
        item: { select: { id: true, name: true, sku: true } },
      },
    });
    return res.status(200).json({ ok: true, data: inventories });
  } catch (e: any) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
