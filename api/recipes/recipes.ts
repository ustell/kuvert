import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';

export default async function Recipes(req: VercelRequest, res: VercelResponse) {
  console.log(req.method, req.url, req.body);
  switch (req.method) {
    case 'GET':
      try {
        const items = await prisma.item.findMany({
          where: {
            name: { contains: req.body.name },
            recipesOf: {
              some: {},
            },
          },
          select: { name: true, recipesOf: true },
        });
        return res.status(200).json({ items });
      } catch (error) {
        return res.status(500).json({ error: 'Server error' });
      }
    default:
      return res.status(500).json({ error: 'Method error' });
  }
}
