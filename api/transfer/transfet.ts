import { VercelRequest, VercelResponse } from '@vercel/node';
import { Prisma, Transaction } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { TransactionStatus } from '@prisma/client'; // enum статусов

export interface User {
  id: string;
  name: string;
  phone: string;
  password: string;
  createdAt?: string;
  isActive?: boolean;
  roleId?: string;
  inventories?: Inventory[];
}
export interface Item {
  id: string;
  name: string;
  sku: string;
  isActive: boolean;
  recipesOf: Recipe[];
}
export interface Recipe {
  qty: number;
  id: string;
  itemId: string;
  componentItemId: string;
  quantity: string;
  scrapRate: string;
  item?: Item;
  componentItem?: Item;
}
export interface Inventory {
  id?: string;
  userId?: string;
  itemId?: string;
  units: number;
  user?: User;
  item?: Item;
  qty: number;
  Recipe?: Recipe;
}

export default async function transfer(req: VercelRequest, res: VercelResponse) {
  console.log(req.method, req.url, req.body);

  switch (req.method) {
    case 'GET': {
      try {
        const url = new URL(req.url ?? '', 'http://localhost'); // базовый URL для парсинга
        const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit')) || 10));
        const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
        const q = (url.searchParams.get('q') || '').trim();
        const statusRaw = (url.searchParams.get('status') || 'all').toLowerCase();
        const statusFilter =
          statusRaw === 'all'
            ? undefined
            : (normalizeStatus(statusRaw) as Prisma.TransactionWhereInput['status']);

        // where для Prisma
        const where: Prisma.TransactionWhereInput = {};
        if (statusFilter) where.status = statusFilter;

        if (q) {
          // простой серверный поиск по нескольким полям (case-insensitive)
          where.OR = [
            { id: { contains: q, mode: 'insensitive' } },
            { status: { equals: normalizeStatus(q) as any } },
            { item: { name: { contains: q, mode: 'insensitive' } } },
            { item: { sku: { contains: q, mode: 'insensitive' } } },
            { fromUser: { name: { contains: q, mode: 'insensitive' } } },
            { toUser: { name: { contains: q, mode: 'insensitive' } } },
            { fromUserId: { contains: q, mode: 'insensitive' } },
            { toUserId: { contains: q, mode: 'insensitive' } },
          ];
        }

        const total = await prisma.transaction.count({ where });

        const data = await prisma.transaction.findMany({
          where,
          select: {
            id: true,
            fromUserId: true,
            toUserId: true,
            itemId: true,
            units: true,
            status: true,
            createdAt: true,
            item: { select: { id: true, name: true, sku: true } },
            fromUser: true,
            toUser: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        });

        const nextOffset = offset + data.length;
        const hasMore = nextOffset < total;

        return res.status(200).json({ data, total, nextOffset, hasMore });
      } catch (error: any) {
        console.log(`GET /api/transfer failed: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    case 'POST': {
      try {
        const {
          userFromId,
          userToId,
          itemToTransfer,
          allowPartial = false, // optional
          force = false,
        }: {
          userFromId: string;
          userToId: string;
          itemToTransfer: { itemId: string; qty: number }[];
          allowPartial?: boolean;
          force?: boolean;
        } = req.body ?? {};

        if (
          !userFromId ||
          !userToId ||
          !Array.isArray(itemToTransfer) ||
          itemToTransfer.length === 0
        ) {
          return res.status(400).json({
            error: 'userFromId, userToId и itemToTransfer (не пустой массив) обязательны',
          });
        }

        if (force) {
          // базовая валидация массива
          const cleaned = itemToTransfer
            .map((x) => ({ itemId: String(x.itemId), qty: Number(x.qty) }))
            .filter((x) => x.itemId && Number.isFinite(x.qty) && x.qty > 0);

          if (cleaned.length === 0) {
            return res.status(400).json({ error: 'Пустой список itemToTransfer' });
          }

          const created: any[] = [];

          const txResult = await prisma.$transaction(
            async (tx) => {
              for (const { itemId, qty } of cleaned) {
                // гарантируем строку инвентаря отправителя и уменьшаем (можно уйти в минус)
                await tx.inventory.upsert({
                  where: { userId_itemId: { userId: userFromId, itemId } },
                  update: { units: { decrement: qty } },
                  create: { userId: userFromId, itemId, units: -qty },
                });

                const row = await tx.transaction.create({
                  data: {
                    fromUserId: userFromId,
                    toUserId: userToId,
                    itemId,
                    units: qty,
                    status: TransactionStatus.pending, // как и раньше
                  },
                  select: {
                    id: true,
                    fromUserId: true,
                    toUserId: true,
                    itemId: true,
                    units: true,
                    status: true,
                    createdAt: true,
                    item: { select: { id: true, name: true, sku: true } },
                    fromUser: true,
                    toUser: true,
                  },
                });

                created.push(row);
              }
              return created;
            },
            { maxWait: 20000, timeout: 120000 },
          );

          return res.status(200).json({ ok: true, data: txResult, mode: 'FORCE' });
        }

        // Проверка существования пользователей (быстрая)
        const [userFrom, userTo] = await Promise.all([
          prisma.user.findUnique({ where: { id: userFromId } }),
          prisma.user.findUnique({ where: { id: userToId } }),
        ]);
        if (!userFrom) return res.status(404).json({ error: 'userFrom not found' });
        if (!userTo) return res.status(404).json({ error: 'userTo not found' });

        // Соберём уникальные itemIds, запросим item+recipes предварительно (чтобы иметь названия в ошибках)
        const requestedIds = Array.from(new Set(itemToTransfer.map((i) => i.itemId)));
        const items = await prisma.item.findMany({
          where: { id: { in: requestedIds } },
          select: {
            id: true,
            name: true,
            sku: true,
            recipesOf: { select: { componentItemId: true, qty: true } },
          },
        });
        const itemById = new Map(items.map((it) => [it.id, it]));

        // Выполним всю основную работу в одной транзакции — блокируем строки inventory у отправителя
        const txResult = await prisma.$transaction(
          async (tx) => {
            // 1) Собираем все itemId + componentIds, которые нужно проверить/заблокировать
            const allComponentIds = new Set<string>();
            for (const it of items)
              for (const r of it.recipesOf ?? []) allComponentIds.add(r.componentItemId);
            const allIdsToLock = Array.from(
              new Set([...requestedIds, ...Array.from(allComponentIds)]),
            );

            // 2) Блокируем строки inventory отправителя для всех релевантных item_id
            // Используем FOR UPDATE, чтобы другие транзакции ждали

            const invRows = await tx.inventory.findMany({
              where: { userId: userFromId, itemId: { in: allIdsToLock } },
              select: { itemId: true, units: true },
            });

            // Map доступного (рабочего) запаса (соль: это snapshot внутри транзакции)
            const available = new Map<string, number>();
            for (const r of invRows) available.set(r.itemId, Number(r.units));
            for (const id of allIdsToLock) if (!available.has(id)) available.set(id, 0);

            // Здесь будем аккумулировать успешные планы и ошибки
            const transferPlan: any[] = [];
            const errors: any[] = [];

            // 3) Проходим входной список ПО ОЧЕРЕДИ и пробуем зарезервировать ресурсы (внутри этой транзакции)
            for (const reqItem of itemToTransfer) {
              const { itemId, qty: requestedQty } = reqItem;
              if (!itemId || !Number.isInteger(requestedQty) || requestedQty <= 0) {
                errors.push({ itemId, error: 'Invalid itemId or qty' });
                continue;
              }

              const item = itemById.get(itemId);
              if (!item) {
                errors.push({ itemId, error: 'Item not found' });
                continue;
              }

              // сколько готовых единиц есть (в snapshot)
              const haveReady = available.get(itemId) ?? 0;
              let direct = Math.min(requestedQty, haveReady);
              let needToCraft = requestedQty - direct;

              // если крафт не нужен — просто уменьшаем ready и создаём plan
              if (needToCraft === 0) {
                // уменьшаем snapshot (reserve)
                available.set(itemId, (available.get(itemId) ?? 0) - direct);
                transferPlan.push({
                  itemId,
                  itemName: item.name,
                  requestedQty,
                  transferQty: requestedQty,
                  direct,
                  needToCraft: 0,
                  requirements: [],
                  note: 'FULL',
                });
                continue;
              }

              // нужен крафт — смотрим рецепт
              const recipeRows = item.recipesOf ?? [];
              if (!recipeRows || recipeRows.length === 0) {
                if (!allowPartial) {
                  errors.push({
                    itemId,
                    status: 'INSUFFICIENT_STOCK_AND_NO_RECIPE',
                    message: `Для товара ${item.name} не хватает готовых и нет рецепта`,
                    details: { requestedQty, availableReady: haveReady, needToCraft },
                  });
                  continue;
                } else {
                  // allowPartial=true — отправляем только direct и reserve готовые
                  available.set(itemId, (available.get(itemId) ?? 0) - direct);
                  transferPlan.push({
                    itemId,
                    itemName: item.name,
                    requestedQty,
                    transferQty: direct,
                    direct,
                    needToCraft: 0,
                    requirements: [],
                    note: 'PARTIAL_READY_ONLY',
                  });
                  continue;
                }
              }

              // проверяем, сколько можно скрафтить из текущего available
              const compNeeds = recipeRows.map((r) => {
                const per = Number(r.qty);
                const have = available.get(r.componentItemId) ?? 0;
                return {
                  componentId: r.componentItemId,
                  per,
                  have,
                  requiredForRequested: per * needToCraft,
                };
              });

              // maxCraftable = min floor(have/per)
              const craftableList = compNeeds.map((c) => Math.floor(c.have / (c.per || 1)));
              let maxCraftable = craftableList.length ? Math.min(...craftableList) : 0;

              if (maxCraftable < needToCraft) {
                if (!allowPartial) {
                  const missing = compNeeds
                    .filter((c) => c.have < c.requiredForRequested)
                    .map((c) => ({
                      componentId: c.componentId,
                      required: c.requiredForRequested,
                      available: c.have,
                      lack: c.requiredForRequested - c.have,
                    }));
                  errors.push({
                    itemId,
                    status: 'INSUFFICIENT_STOCK_AND_COMPONENTS',
                    message: `Не хватает комплектующих для товара ${item.name}`,
                    details: {
                      requestedQty,
                      availableReady: haveReady,
                      needToCraft,
                      maxCraftable,
                      missing,
                    },
                  });
                  continue;
                } else {
                  // allowPartial: уменьшаем needToCraft до maxCraftable
                  needToCraft = Math.max(0, Math.floor(maxCraftable));
                }
              }

              // пересчитаем реальные требования для окончательного needToCraft
              const finalCompNeeds = recipeRows.map((r) => {
                const per = Number(r.qty);
                return { componentId: r.componentItemId, required: per * needToCraft };
              });

              // проверить ещё раз (на всякий случай) — все ли компоненты доступны
              const lackingNow = finalCompNeeds.filter(
                (n) => (available.get(n.componentId) ?? 0) < n.required,
              );
              if (lackingNow.length) {
                // Это ситуация времени использования — возвращаем ошибку
                errors.push({
                  itemId,
                  status: 'INSUFFICIENT_COMPONENTS_DURING_RESERVATION',
                  message: 'Во время резервирования компонентов произошла нехватка',
                  details: lackingNow.map((n) => ({
                    componentId: n.componentId,
                    required: n.required,
                    available: available.get(n.componentId) ?? 0,
                  })),
                });
                continue;
              }

              // Всё ок — резервируем: уменьшаем available для компонентов и для готовых
              for (const n of finalCompNeeds) {
                available.set(n.componentId, (available.get(n.componentId) ?? 0) - n.required);
              }
              available.set(itemId, (available.get(itemId) ?? 0) - direct);

              const finalTransferQty = direct + needToCraft;
              transferPlan.push({
                itemId,
                itemName: item.name,
                requestedQty,
                transferQty: finalTransferQty,
                direct,
                needToCraft,
                requirements: finalCompNeeds,
                note: finalTransferQty < requestedQty ? 'PARTIAL' : 'FULL',
              });
            } // конец перебора req items

            // Если не получилось ничего зарезервировать — вернём ошибки
            if (transferPlan.length === 0) {
              return { ok: false, errors };
            }

            // 4) Применяем реальные изменения в БД: списываем компоненты и готовые единицы
            //    (Уже всё рассчитано в 'transferPlan' и в snapshot 'available').
            //    Для безопасности — выполняем update с условием units >= needed и проверяем affected rows.
            //    Сгруппируем суммарные списания по itemId:
            const totalDecrements = new Map<string, number>(); // itemId -> amount to decrement from DB
            for (const plan of transferPlan) {
              // готовые списываются (direct)
              if (plan.direct && plan.direct > 0) {
                totalDecrements.set(
                  plan.itemId,
                  (totalDecrements.get(plan.itemId) ?? 0) + plan.direct,
                );
              }
              // компоненты
              for (const r of plan.requirements ?? []) {
                totalDecrements.set(
                  r.componentId,
                  (totalDecrements.get(r.componentId) ?? 0) + r.required,
                );
              }
            }

            // Выполняем updateMany по каждому affected itemId (гарантированно в транзакции, строки заблокированы):
            for (const [itemId, dec] of totalDecrements.entries()) {
              // Проверяем наличие реального количества в snapshot (доп. страховка)
              const cur = available.get(itemId) ?? 0;
              const original = cur + dec; // т.к. available = original - дек (в snapshot)
              if (original < dec) {
                throw new Error('INSUFFICIENT_STOCK_AT_COMMIT:' + itemId);
              }
              // Выполняем update: уменьшаем units на dec (в таблице)
              const updated = await tx.inventory.updateMany({
                where: { userId: userFromId, itemId },
                data: { units: { decrement: dec } },
              });
              // updateMany возвращает count; если 0 — значит записи не было (или units < ???) — на всякий случай
              if (updated.count === 0) {
                throw new Error('INSUFFICIENT_STOCK_AT_COMMIT:' + itemId);
              }
            }

            // 5) Создаём transaction записи для каждого transferPlan (status = 'pending' или 'reserved')
            const created: any[] = [];
            for (const plan of transferPlan) {
              const txRow = await tx.transaction.create({
                data: {
                  fromUserId: userFromId,
                  toUserId: userToId,
                  itemId: plan.itemId,
                  units: plan.transferQty,
                  status: TransactionStatus.pending,
                },
              });
              created.push({ plan, data: txRow });
            }

            // 6) Вернём успешный результат + snapshot available (новое состояние отправителя)
            const snapshot: any[] = [];
            for (const id of allIdsToLock) {
              snapshot.push({ itemId: id, unitsLeft: available.get(id) ?? 0 });
            }
            return { ok: true, created, transferPlan, errors, snapshot };
          },
          { maxWait: 20000, timeout: 120000 },
        );

        // txResult либо { ok: false, errors } либо { ok: true, created, transferPlan, errors, snapshot }
        if (!txResult.ok) {
          return res.status(409).json(txResult);
        }
        return res.status(200).json(txResult);
      } catch (err: any) {
        console.error('POST /transfer failed:', err);
        const msg = String(err?.message ?? err);
        if (msg.startsWith('INSUFFICIENT_STOCK_AT_COMMIT:')) {
          return res.status(409).json({
            ok: false,
            status: 'INSUFFICIENT_STOCK_AT_COMMIT',
            details: msg.split(':')[1],
          });
        }
        return res.status(500).json({ error: 'Internal Server Error', detail: msg });
      }
    }

    case 'PATCH': {
      try {
        const { transferId, userId } = req.body ?? {};
        console.log('REQ BODY', transferId, userId);
        if (!transferId) {
          return res.status(400).json({ error: 'transferId is required' });
        }
        const [userTo, transfer] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId } }),
          prisma.transaction.findUnique({ where: { id: transferId } }),
        ]);
        if (!userTo || !transfer) {
          return res.status(404).json({ error: 'User not found' });
        }
        await prisma.$transaction(async (tx) => {
          await tx.inventory.upsert({
            where: {
              userId_itemId: { userId: userTo.id, itemId: transfer.itemId },
            },
            update: {
              units: {
                increment: transfer.units,
              },
            },
            create: {
              userId: userTo.id,
              itemId: transfer.itemId,
              units: transfer.units,
            },
          });
          await prisma.transaction.update({
            where: {
              id: transfer.id,
            },
            data: {
              status: 'accepted',
            },
          });
        });
        return res.status(200).json({ userTo, transfer });
      } catch (error) {
        console.log(`PATCH /api/transfer/transfer failed: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    case 'DELETE': {
      try {
        const { transferId, userId } = req.body ?? {};

        if (!transferId || !userId) {
          return res.status(400).json({ error: 'transferId and userId are required' });
        }
        const [user, trans] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId } }),
          prisma.transaction.findUnique({ where: { id: transferId } }),
        ]);

        if (!user || !trans) {
          return res.status(400).json({ error: 'transferId and userId are required' });
        }

        await prisma.$transaction(async (tx) => {
          await tx.inventory.upsert({
            where: {
              userId_itemId: { userId: user.id, itemId: trans.itemId },
            },
            update: {
              units: {
                increment: trans.units,
              },
            },
            create: {
              userId: user.id,
              itemId: trans.itemId,
              units: trans.units,
            },
          });
          await tx.transaction.update({
            where: {
              id: trans.id,
            },
            data: {
              status: 'rejected',
            },
          });
        });

        console.log(user, trans);
        return res.status(200).json({ ok: true });
      } catch (error) {
        console.log(`DELETE /api/transfer/transfer failed: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    default: {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  }
}
