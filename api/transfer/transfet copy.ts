import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { TransactionStatus } from '@prisma/client'; // enum статусов

export default async function transfer(req: VercelRequest, res: VercelResponse) {
  console.log(req.method, req.url, req.body);

  function isUuid(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v ?? '',
    );
  }

  async function resolveSenderInventory(userFromId: string, invKey: string) {
    const key = (invKey ?? '').trim();
    if (!key) return null;

    const orClauses: any[] = [
      { item: { sku: key } },
      { item: { name: { equals: key, mode: 'insensitive' } } },
    ];

    if (isUuid(key)) {
      orClauses.unshift({ id: key });
      orClauses.unshift({ itemId: key });
    }

    const rec = await prisma.inventory.findFirst({
      where: { userId: userFromId, OR: orClauses },
      select: { id: true, itemId: true, units: true },
    });

    return rec ? { id: rec.id, itemId: rec.itemId, units: rec.units } : null;
  }

  async function listUserInventoryPreview(userFromId: string, limit = 20) {
    const rows = await prisma.inventory.findMany({
      where: { userId: userFromId },
      select: {
        id: true,
        itemId: true,
        units: true,
        item: { select: { sku: true, name: true } },
      },
      take: limit,
    });
    return rows.map((r) => ({
      inventoryId: r.id,
      itemId: r.itemId,
      sku: r.item?.sku ?? null,
      name: r.item?.name ?? null,
      units: r.units,
    }));
  }

  // central switch by method
  switch (req.method) {
    case 'POST': {
      try {
        const { userFromId, userToId, invItem, qty } = req.body ?? {};
        if (!userFromId || !userToId || !invItem) {
          return res.status(400).json({ error: 'Invalid payload' });
        }
        if (userFromId === userToId) {
          return res.status(400).json({ error: 'userToId must differ from userFromId' });
        }

        // 1) оба пользователя существуют?
        const users = await prisma.user.findMany({
          where: { id: { in: [userFromId, userToId] } },
          select: { id: true },
        });
        if (users.length !== 2) {
          return res.status(404).json({ error: 'User not found' });
        }
        const invCount = await prisma.inventory.count({ where: { userId: userFromId } });
        if (invCount === 0) {
          return res.status(404).json({
            error: 'Sender has no inventory rows',
            hint: 'У отправителя нет ни одной позиции в инвентаре. Создай хотя бы одну (Inventory) или выбери другого userFromId.',
          });
        }

        // 2) позиция инвентаря отправителя (поддерживаем и inventory.id, и itemId)
        const inv = await resolveSenderInventory(userFromId, invItem);
        if (!inv) {
          const examples = await listUserInventoryPreview(userFromId, 20);
          if (examples.length === 0) {
            return res.status(404).json({
              error: 'Sender has no inventory rows',
              hint: 'У отправителя нет ни одной позиции в инвентаре. Создай хотя бы одну (Inventory) или выбери другого userFromId.',
            });
          }
          return res.status(404).json({
            error: 'Inventory item not found for userFromId',
            hint: 'Проверь invItem: допустимы inventory.id, itemId (UUID), sku или name.',
            examples,
          });
        }

        const availableReady = inv.units;

        // A) хватает готового — крафт не нужен → СОЗДАЁМ soft-транзакцию
        if (availableReady >= qty) {
          console.log('----- ПРОБНЫЙ ЗАПУСК ПЕРЕДАЧИ -----');
          console.log(`ItemId: ${inv.itemId}`);
          console.log(`Запрошено: ${qty}`);
          console.log(`Доступно готовых: ${availableReady}`);
          console.log('Достаточно готовых на складе. Крафтинг не требуется.');
          console.log('----- КОНЕЦ ПРОБНОГО ЗАПУСКА -----');

          const tx = await prisma.transaction.create({
            data: {
              fromUserId: userFromId,
              toUserId: userToId,
              itemId: inv.itemId,
              units: qty,
              status: TransactionStatus.pending,
            },
          });

          return res.status(201).json({
            ok: true,
            status: 'PENDING_READY',
            message: 'Транзакция создана (крафт не требуется)',
            data: {
              transaction: tx,
              plan: { itemId: inv.itemId, qtyRequested: qty, transfer: { direct: qty, craft: 0 } },
            },
          });
        }

        // B) нужно докрафтить недостающее
        const needToCraft = qty - availableReady;

        // 3) рецепт изделия
        const recipe = await prisma.item.findUnique({
          where: { id: inv.itemId },
          select: {
            name: true,
            recipesOf: {
              select: {
                qty: true,
                componentItem: { select: { id: true, name: true } },
              },
            },
          },
        });

        if (!recipe || !recipe.recipesOf?.length) {
          return res.status(409).json({
            ok: false,
            status: 'INSUFFICIENT_STOCK_AND_NO_RECIPE',
            message: 'Не достаточно товара, и не достаточно комплектующих для его крафта',
            details: { itemId: inv.itemId, itemName: recipe?.name, availableReady, needToCraft },
          });
        }

        // 4) требования по компонентам на докрафт
        const requirements = recipe.recipesOf.map(({ qty, componentItem }) => ({
          componentId: componentItem.id,
          componentName: componentItem.name,
          perUnit: qty,
          totalRequired: qty * needToCraft,
        }));

        // 5) остатки компонентов у отправителя
        const componentsInv = await prisma.inventory.findMany({
          where: { userId: userFromId, itemId: { in: requirements.map((r) => r.componentId) } },
          select: { itemId: true, units: true },
        });
        const availableById = new Map(componentsInv.map((c) => [c.itemId, Number(c.units) || 0]));

        const deficits = requirements
          .map((r) => {
            const have = availableById.get(r.componentId) ?? 0;
            return { ...r, available: have, lack: r.totalRequired - have };
          })
          .filter((r) => r.lack > 0);

        if (deficits.length > 0) {
          console.log('----- ПРОБНЫЙ ЗАПРОС ТРАНСФЕРА -----');
          console.log('----- остатки компонентов у отправителя -----');
          console.log(`Товар: ${recipe.name}`);
          console.log(`Запрошено: ${qty}`);
          console.log(`Доступно (готово): ${availableReady}`);
          console.log(`Будет создано: ${needToCraft}`);
          console.log('Отсутствующие компоненты:');
          deficits.forEach((d) =>
            console.log(
              `  - ${d.componentName}: нужно ${d.totalRequired}, есть ${d.available}, не хватает ${d.lack}`,
            ),
          );
          console.log('----- END DRY RUN -----');

          return res.status(409).json({
            ok: false,
            status: 'INSUFFICIENT_STOCK_AND_COMPONENTS',
            message: 'Не достаточно товара, и не достаточно комплектующих для его крафта',
            details: {
              itemId: inv.itemId,
              itemName: recipe.name,
              qtyRequested: qty,
              availableReady,
              needToCraft,
              missingComponents: deficits.map((d) => ({
                componentId: d.componentId,
                componentName: d.componentName,
                perUnit: d.perUnit, // <-- ДОБАВИЛИ
                required: d.totalRequired,
                available: d.available,
                lack: d.lack,
              })),
            },
          });
        }

        // 6) комплектующих хватает → СОЗДАЁМ soft-транзакцию (без списаний)
        const componentsToConsume = requirements.map((r) => ({
          componentId: r.componentId,
          componentName: r.componentName,
          perUnit: r.perUnit,
          total: r.totalRequired,
          available: availableById.get(r.componentId) ?? 0,
        }));

        console.log('----- DRY RUN TRANSFER -----');
        console.log('----- комплектующих хватает → СОЗДАЁМ soft-транзакцию -----');
        console.log(`Товар: ${recipe.name}`);
        console.log(`Запрошено: ${qty}`);
        console.log(`Доступно (готово к отправке): ${availableReady}`);
        console.log(`Отправится напрямую: ${availableReady}`);
        console.log(`Будет крафтировано: ${needToCraft}`);
        console.log('Комплектующие, которые необходимо потребить для крафта:');
        componentsToConsume.forEach((c) =>
          console.log(
            `  - ${c.componentName}: на единицу ${c.perUnit} x ${needToCraft} = ${c.total} (имеется ${c.available})`,
          ),
        );
        console.log('----- END DRY RUN -----');

        const tx = await prisma.transaction.create({
          data: {
            fromUserId: userFromId,
            toUserId: userToId,
            itemId: inv.itemId,
            units: qty,
            status: TransactionStatus.pending,
          },
        });

        return res.status(201).json({
          ok: true,
          status: 'PENDING_CRAFTABLE',
          message: 'Транзакция создана (требуется крафт, но комплектующие есть)',
          data: {
            transaction: tx,
            plan: {
              itemId: inv.itemId,
              itemName: recipe.name,
              qtyRequested: qty,
              transfer: { direct: availableReady, craft: needToCraft },
              componentsToConsume,
            },
          },
        });
      } catch (err: any) {
        console.error('POST /transfer failed:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    case 'PATCH': {
      try {
        const { txId, action = 'accept' } = req.body ?? {};
        if (!txId) return res.status(400).json({ error: 'txId is required' });

        // 1) читаем транзакцию
        const tx = await prisma.transaction.findUnique({
          where: { id: txId },
          select: {
            id: true,
            status: true,
            units: true,
            itemId: true,
            fromUserId: true,
            toUserId: true,
          },
        });
        if (!tx) return res.status(404).json({ error: 'Transaction not found' });

        if (action === 'reject') {
          if (tx.status !== TransactionStatus.pending) {
            return res
              .status(409)
              .json({ error: `Cannot reject transaction with status ${tx.status}` });
          }
          const rej = await prisma.transaction.update({
            where: { id: tx.id },
            data: { status: TransactionStatus.rejected },
          });
          return res.status(200).json({ ok: true, status: 'REJECTED', transaction: rej });
        }

        // по умолчанию action = 'accept'
        if (tx.status !== TransactionStatus.pending) {
          return res.status(409).json({ error: `Transaction already ${tx.status}` });
        }

        // 2) текущие остатки у отправителя по самому товару
        const senderItemInv = await prisma.inventory.findUnique({
          where: { userId_itemId: { userId: tx.fromUserId, itemId: tx.itemId } },
          select: { id: true, units: true },
        });
        const ready = senderItemInv?.units ?? 0;
        const direct = Math.min(tx.units, ready);
        const needToCraft = tx.units - direct;

        // 3) если нужен крафт — читаем рецепт и проверяем компоненты
        let requirements: { componentId: string; perUnit: number; totalRequired: number }[] = [];
        if (needToCraft > 0) {
          const recipe = await prisma.item.findUnique({
            where: { id: tx.itemId },
            select: { recipesOf: { select: { qty: true, componentItemId: true } } },
          });
          if (!recipe || recipe.recipesOf.length === 0) {
            return res.status(409).json({
              ok: false,
              status: 'INSUFFICIENT_STOCK_AND_NO_RECIPE',
              message: 'Не достаточно товара, и не достаточно комплектующих для его крафта',
              details: { itemId: tx.itemId, availableReady: ready, needToCraft },
            });
          }

          requirements = recipe.recipesOf.map((r) => ({
            componentId: r.componentItemId,
            perUnit: r.qty,
            totalRequired: r.qty * needToCraft,
          }));

          const compInv = await prisma.inventory.findMany({
            where: {
              userId: tx.fromUserId,
              itemId: { in: requirements.map((r) => r.componentId) },
            },
            select: { itemId: true, units: true },
          });
          const haveMap = new Map(compInv.map((c) => [c.itemId, c.units]));

          const deficits = requirements
            .map((r) => ({ ...r, have: haveMap.get(r.componentId) ?? 0 }))
            .filter((r) => r.have < r.totalRequired);

          if (deficits.length > 0) {
            return res.status(409).json({
              ok: false,
              status: 'INSUFFICIENT_STOCK_AND_COMPONENTS',
              message: 'Не достаточно товара, и не достаточно комплектующих для его крафта',
              details: {
                itemId: tx.itemId,
                qtyRequested: tx.units,
                availableReady: ready,
                needToCraft,
                missingComponents: deficits.map((d) => ({
                  componentId: d.componentId,
                  required: d.totalRequired,
                  available: d.have,
                  lack: d.totalRequired - d.have,
                })),
              },
            });
          }
        }

        // 4) применяем изменения атомарно
        const accepted = await prisma.$transaction(async (db) => {
          // 4.1) списываем компоненты под крафт (если нужен)
          if (needToCraft > 0) {
            for (const r of requirements) {
              const comp = await db.inventory.findUnique({
                where: { userId_itemId: { userId: tx.fromUserId, itemId: r.componentId } },
                select: { id: true, units: true },
              });
              const have = comp?.units ?? 0;
              if (have < r.totalRequired) {
                throw new Error(`INSUFFICIENT_COMPONENT:${r.componentId}`);
              }
              await db.inventory.update({
                where: { userId_itemId: { userId: tx.fromUserId, itemId: r.componentId } },
                data: { units: have - r.totalRequired },
              });
            }
          }

          // 4.2) списываем готовые единицы у отправителя
          if (direct > 0) {
            if (!senderItemInv) {
              throw new Error('SENDER_ITEM_INV_MISSING');
            }
            const have = senderItemInv.units;
            if (have < direct) throw new Error('INSUFFICIENT_READY_STOCK');
            await db.inventory.update({
              where: { id: senderItemInv.id },
              data: { units: have - direct },
            });
          }

          // 4.3) зачисляем ПОЛНЫЙ объём получателю (direct + craft)
          const receiverInv = await db.inventory.findUnique({
            where: { userId_itemId: { userId: tx.toUserId, itemId: tx.itemId } },
            select: { id: true, units: true },
          });
          if (receiverInv) {
            await db.inventory.update({
              where: { id: receiverInv.id },
              data: { units: receiverInv.units + tx.units },
            });
          } else {
            await db.inventory.create({
              data: { userId: tx.toUserId, itemId: tx.itemId, units: tx.units },
            });
          }

          // 4.4) помечаем транзакцию как accepted
          return db.transaction.update({
            where: { id: tx.id },
            data: { status: TransactionStatus.accepted },
          });
        });

        return res.status(200).json({
          ok: true,
          status: 'ACCEPTED',
          message: 'Перевод подтверждён, списание/зачисление выполнены',
          data: { transaction: accepted, applied: { direct, crafted: needToCraft } },
        });
      } catch (e: any) {
        if (typeof e?.message === 'string' && e.message.startsWith('INSUFFICIENT_COMPONENT')) {
          const componentId = e.message.split(':')[1];
          return res.status(409).json({
            ok: false,
            status: 'INSUFFICIENT_STOCK_AND_COMPONENTS_RACE',
            message: 'Компоненты закончились при подтверждении',
            details: { componentId },
          });
        }
        if (e?.message === 'INSUFFICIENT_READY_STOCK') {
          return res.status(409).json({
            ok: false,
            status: 'INSUFFICIENT_READY_STOCK_RACE',
            message: 'Готового товара не хватило при подтверждении',
          });
        }
        console.error('PATCH /transfer failed:', e);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    default: {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  }
}
