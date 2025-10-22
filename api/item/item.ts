import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';

export default async function item(req: VercelRequest, res: VercelResponse) {
  console.log(req.method, req.url, req.body);
  switch (req.method) {
    case 'GET':
      try {
        const items = await prisma.item.findMany({
          include: {
            recipesOf: {
              include: {
                componentItem: true,
              },
            },
          },
        });

        return res.status(200).json({ items });
      } catch (error) {
        return res.status(500).json({ error: 'Server error' });
      }
    case 'POST': {
      const { sku, name, comp } = req.body as {
        sku: string;
        name: string;
        comp?: Array<{ id?: string; sku?: string; qty?: number }>;
      };

      if (!sku || !name) return res.status(400).json({ error: 'sku and name are required' });

      const existingItem = await prisma.item.findUnique({ where: { sku } });
      if (existingItem) return res.status(400).json({ error: 'Item already exists' });

      // Нормализуем comp: берём либо id, либо sku. Убираем пустые.
      const comps = (comp ?? [])
        .map((c) => ({ id: c?.id, sku: c?.sku, qty: c?.qty ?? 1 }))
        .filter((c) => !!c.id || !!c.sku);

      try {
        const item = await prisma.item.create({
          data: {
            sku,
            name,
            recipesOf: {
              create: comps.map((c) => ({
                qty: c.qty,
                componentItem: {
                  connect: c.id ? { id: c.id } : { sku: c.sku! }, // ← вот ключевая правка
                },
              })),
            },
          },
          include: { recipesOf: { include: { componentItem: true } } },
        });

        return res.status(201).json({ item });
      } catch (error) {
        console.log(error, 'error creating item');
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
    case 'DELETE':
      try {
        const { id } = req.body;
        console.log(id, 'API');
        if (!id) return res.status(400).json({ error: 'id is required' });

        const item = await prisma.item.delete({ where: { id } });
        return res.status(200).json({ item });
      } catch (err) {
        return res.status(500).json({ error: 'Failed to delete' });
      }
    case 'PATCH': {
      try {
        const { id, sku, name, comp } = req.body as {
          id: string;
          sku: string;
          name: string;
          comp?: Array<{ id?: string; sku?: string; qty?: number }>;
        };

        const current = await prisma.item.findUnique({ where: { id } });
        if (!current) return res.status(404).json({ error: "Can't find item" });

        // Нормализация входа
        const comps = (Array.isArray(comp) ? comp : [])
          .map((c) => ({ id: c?.id, sku: c?.sku, qty: Math.max(1, c?.qty ?? 1) }))
          .filter((c) => !!c.id || !!c.sku);

        // Если comp = undefined -> рецепт не трогаем. Только sku/name
        if (comp === undefined) {
          const updated = await prisma.item.update({
            where: { id },
            data: { sku, name },
            include: { recipesOf: { include: { componentItem: true } } },
          });
          return res.status(200).json({ data: updated });
        }

        // comp передан (включая пустой массив) -> перезаписываем рецепт
        const result = await prisma.$transaction(
          async (tx) => {
            // 1) обновить сам товар
            await tx.item.update({
              where: { id },
              data: { sku, name },
            });

            // 2) снести старый рецепт
            await tx.recipe.deleteMany({ where: { itemId: id } });

            // 3) если comps пуст — всё, рецепт очищен
            if (!comps.length) return;

            // 4) собрать componentItemId для записей с sku
            const needSku = comps.filter((c) => !c.id && !!c.sku).map((c) => c.sku!);
            let skuToId = new Map<string, string>();
            if (needSku.length) {
              const rows = await tx.item.findMany({
                where: { sku: { in: needSku } },
                select: { id: true, sku: true },
              });
              skuToId = new Map(rows.map((r) => [r.sku, r.id]));
              // проверка на несуществующие sku
              const missing = needSku.filter((s) => !skuToId.has(s));
              if (missing.length) {
                throw new Error(`Components not found by sku: ${missing.join(', ')}`);
              }
            }

            // 5) подготовить данные для createMany (быстро, без connect)
            const data = comps.map((c) => ({
              itemId: id,
              componentItemId: c.id ?? skuToId.get(c.sku!)!, // здесь уже есть id
              qty: c.qty,
            }));

            // 6) массовое создание
            await tx.recipe.createMany({ data });
          },
          // увеличить таймаут (опционально, но полезно на холодных стартах/серваках)
          { timeout: 15000 },
        );

        // 7) ВАЖНО: читать итог уже ПОСЛЕ транзакции (не внутри!)
        const full = await prisma.item.findUnique({
          where: { id },
          include: { recipesOf: { include: { componentItem: true } } },
        });

        return res.status(200).json({ data: full });
      } catch (error: any) {
        console.log(error, 'error updating item');
        return res.status(500).json({ error: error?.message ?? 'Internal Server Error' });
      }
    }

    default:
      return res.status(500).json({ error: 'Current method is not supported' });
  }
}
