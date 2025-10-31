import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';

export default async function Inventories(req: VercelRequest, res: VercelResponse) {
  console.log(req.method, req.body, req.url);
  switch (req.method) {
    case 'POST':
      const { id } = req.body;
      try {
        const payload = await prisma.inventory.findMany({
          where: { userId: id },
          include: {
            item: {
              include: {
                recipesOf: {
                  include: {
                    componentItem: true,
                  },
                },
              },
            },
          },
        });
        return res.status(200).json({ payload });
      } catch (error) {
        console.log('Ошибка получения инвентаря. (Prisma): ', error);
        return res.status(500).json({ error: 'Ошибка получения инвентаря. (Prisma)' });
      }

    default:
      console.log('Введен не верный метод');

      return res.status(500).json({ error: 'Method error' });
  }
}
