// api/transfer.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Prisma, TransactionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';

type CanonicalStatus = 'pending' | 'accepted' | 'rejected';
const normalizeStatus = (s: any): CanonicalStatus => {
  const v = String(s ?? '').toLowerCase();
  if (v === 'pending' || v === 'accepted' || v === 'rejected') return v as CanonicalStatus;
  if (v === 'completed') return 'accepted';
  if (v === 'declined' || v === 'canceled' || v === 'cancelled') return 'rejected';
  if (v === 'reserved' || v === 'waiting') return 'pending';
  return 'pending';
};

export default async function transfer(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        try {
          const url = new URL(req.url ?? '', 'http://localhost');
          const rawLimit = Number(url.searchParams.get('limit'));
          const rawOffset = Number(url.searchParams.get('offset'));
          const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(100, rawLimit) : 5;
          const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
          const statusRaw = (url.searchParams.get('status') || 'all').toLowerCase();
          const q = (url.searchParams.get('q') || '').trim();
          const toUserId = (url.searchParams.get('toUserId') || '').trim();
          const fromUserId = (url.searchParams.get('fromUserId') || '').trim();
          const userId = (url.searchParams.get('userId') || '').trim();
          const mine = (url.searchParams.get('mine') || '').trim(); // 'to' | 'from' | 'any'
          const cursorRaw = (url.searchParams.get('cursor') || '').trim(); // format: ISO|id

          const where: Prisma.TransactionWhereInput = {};
          if (statusRaw !== 'all') where.status = normalizeStatus(statusRaw) as any;

          // user filters
          const orUsers: Prisma.TransactionWhereInput[] = [];
          if (toUserId) where.toUserId = toUserId;
          if (fromUserId) where.fromUserId = fromUserId;
          if (userId) {
            if (mine === 'to') where.toUserId = userId;
            else if (mine === 'from') where.fromUserId = userId;
            else if (mine === 'any' || !mine) {
              orUsers.push({ toUserId: userId });
              orUsers.push({ fromUserId: userId });
            }
          }

          // Optimized text search: prefetch matching itemIds/userIds and filter by IDs
          if (q) {
            const terms = q
              .split(/\s+/)
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 5);

            const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const uuidMatches = terms.filter((t) => uuidRe.test(t));
            const nonUuidTerms = terms.filter((t) => !uuidRe.test(t));

            const [itemsHit, usersHit] = nonUuidTerms.length
              ? await Promise.all([
                  prisma.item.findMany({
                    where: {
                      OR: nonUuidTerms.map((t) => ({
                        OR: [
                          { name: { contains: t, mode: 'insensitive' } },
                          { sku: { contains: t, mode: 'insensitive' } },
                        ],
                      })),
                    },
                    select: { id: true },
                    take: 200,
                  }),
                  prisma.user.findMany({
                    where: {
                      OR: nonUuidTerms.map((t) => ({ name: { contains: t, mode: 'insensitive' } })),
                    },
                    select: { id: true },
                    take: 200,
                  }),
                ])
              : [[], []];

            const itemIds = new Set<string>(itemsHit.map((i) => i.id));
            const userIds = new Set<string>(usersHit.map((u) => u.id));

            // If there are no matches at all and no UUIDs, short-circuit to empty
            if (!uuidMatches.length && itemIds.size === 0 && userIds.size === 0) {
              // impossible condition to force empty result
              (where.AND as any) = (where.AND || []) as any[];
              (where.AND as any[]).push({ id: { equals: '00000000-0000-0000-0000-000000000000' } });
            } else {
              const searchOr: Prisma.TransactionWhereInput[] = [];
              // UUID direct matches across fields
              for (const u of uuidMatches) {
                searchOr.push({ id: u });
                searchOr.push({ itemId: u });
                searchOr.push({ toUserId: u });
                searchOr.push({ fromUserId: u });
              }
              if (itemIds.size) searchOr.push({ itemId: { in: Array.from(itemIds) } });
              if (userIds.size) {
                const arr = Array.from(userIds);
                searchOr.push({ toUserId: { in: arr } });
                searchOr.push({ fromUserId: { in: arr } });
              }

              if (searchOr.length) {
                (where.AND as any) = (where.AND || []) as any[];
                (where.AND as any[]).push({ OR: searchOr });
              }
            }
          }

          if (orUsers.length) {
            (where.AND as any) = (where.AND || []) as any[];
            (where.AND as any[]).push({ OR: orUsers });
          }

          // keyset pagination by (createdAt desc, id desc)
          let cursorWhere: Prisma.TransactionWhereInput | undefined;
          if (cursorRaw) {
            const [iso, id] = cursorRaw.split('|');
            const ts = iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso) : null;
            if (ts && id) {
              cursorWhere = {
                OR: [
                  { createdAt: { lt: ts } },
                  { AND: [{ createdAt: ts }, { id: { lt: id } }] },
                ],
              } as Prisma.TransactionWhereInput;
            }
          }

          const finalWhere = cursorWhere
            ? ({ AND: [where, cursorWhere] } as Prisma.TransactionWhereInput)
            : where;

          const data = await prisma.transaction.findMany({
            where: finalWhere,
            select: {
              id: true,
              fromUserId: true,
              toUserId: true,
              itemId: true,
              units: true,
              status: true,
              createdAt: true,
              item: { select: { id: true, name: true, sku: true } },
              fromUser: { select: { id: true, name: true } },
              toUser: { select: { id: true, name: true } },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: limit,
          });

          const last = data.length ? data[data.length - 1] : null;
          const nextCursor = last ? `${last.createdAt.toISOString()}|${last.id}` : null;
          return res
            .status(200)
            .json({ data, nextCursor, hasMore: data.length === limit });
        } catch (e: any) {
          console.log('GET /api/transfer failed:', e.message);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      }

      case 'POST': {
        try {
          const urlForPost = new URL(req.url ?? '', 'http://localhost');
          const light = (urlForPost.searchParams.get('light') || '') === '1';
          const {
            userFromId,
            userToId,
            itemToTransfer,
            allowPartial = false,
            force = false,
          } = (req.body ?? {}) as {
            userFromId: string;
            userToId: string;
            itemToTransfer: { itemId: string; qty: number }[];
            allowPartial?: boolean;
            force?: boolean;
          };

          if (!userFromId || !userToId || !Array.isArray(itemToTransfer) || !itemToTransfer.length)
            return res
              .status(400)
              .json({ error: 'userFromId, userToId и itemToTransfer обязательны' });

          if (force) {
            const cleaned = itemToTransfer
              .map((x) => ({ itemId: String(x.itemId), qty: Number(x.qty) }))
              .filter((x) => x.itemId && Number.isFinite(x.qty) && x.qty > 0);
            if (!cleaned.length)
              return res.status(400).json({ error: 'Пустой список itemToTransfer' });

            const created = await prisma.$transaction(async (tx) => {
              const invOps: Promise<any>[] = [];
              const now = new Date();
              const txRows: { id: string; fromUserId: string; toUserId: string; itemId: string; units: number; status: TransactionStatus; finishedAt?: Date }[] = [];
              for (const { itemId, qty } of cleaned) {
                invOps.push(
                  tx.inventory.upsert({
                    where: { userId_itemId: { userId: userFromId, itemId } },
                    update: { units: { decrement: qty } },
                    create: { userId: userFromId, itemId, units: -qty },
                  }),
                );
                invOps.push(
                  tx.inventory.upsert({
                    where: { userId_itemId: { userId: userToId, itemId } },
                    update: { units: { increment: qty } },
                    create: { userId: userToId, itemId, units: qty },
                  }),
                );
                txRows.push({
                  id: randomUUID(),
                  fromUserId: userFromId,
                  toUserId: userToId,
                  itemId,
                  units: qty,
                  status: TransactionStatus.accepted,
                  finishedAt: now,
                });
              }
              await Promise.all(invOps);
              await tx.transaction.createMany({ data: txRows });
              if (light) {
                return txRows.map((r) => ({
                  id: r.id,
                  fromUserId: r.fromUserId,
                  toUserId: r.toUserId,
                  itemId: r.itemId,
                  units: r.units,
                  status: r.status,
                  createdAt: now,
                  finishedAt: r.finishedAt ?? null,
                }));
              } else {
                const ids = txRows.map((r) => r.id);
                const fetched = await tx.transaction.findMany({
                  where: { id: { in: ids } },
                  select: {
                    id: true,
                    fromUserId: true,
                    toUserId: true,
                    itemId: true,
                    units: true,
                    status: true,
                    createdAt: true,
                    finishedAt: true,
                    item: { select: { id: true, name: true, sku: true } },
                    fromUser: { select: { id: true, name: true } },
                    toUser: { select: { id: true, name: true } },
                  },
                });
                return fetched;
              }
            }, { timeout: 20000, maxWait: 5000 });

            if (light) {
              return res.status(200).json({ ok: true, data: created, mode: 'FORCE' });
            } else {
              // load updated inventories for both users
              const [inventoriesFrom, inventoriesTo] = await Promise.all([
                prisma.inventory.findMany({ where: { userId: userFromId }, include: { item: true } }),
                prisma.inventory.findMany({ where: { userId: userToId }, include: { item: true } }),
              ]);

              return res
                .status(200)
                .json({ ok: true, data: created, mode: 'FORCE', inventoriesFrom, inventoriesTo });
            }
          }

          const [userFrom, userTo] = await Promise.all([
            prisma.user.findUnique({ where: { id: userFromId } }),
            prisma.user.findUnique({ where: { id: userToId } }),
          ]);
          if (!userFrom) return res.status(404).json({ error: 'userFrom not found' });
          if (!userTo) return res.status(404).json({ error: 'userTo not found' });

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

          const txResult = await prisma.$transaction(async (tx) => {
            const comps = new Set<string>();
            for (const it of items)
              for (const r of it.recipesOf ?? []) comps.add(r.componentItemId);
            const allIds = Array.from(new Set([...requestedIds, ...Array.from(comps)]));

            const inv = await tx.inventory.findMany({
              where: { userId: userFromId, itemId: { in: allIds } },
              select: { itemId: true, units: true },
            });
            const avail = new Map(allIds.map((id) => [id, 0]));
            for (const r of inv) avail.set(r.itemId, Number(r.units));

            const plan: any[] = [],
              errors: any[] = [];
            for (const { itemId, qty } of itemToTransfer) {
              const item = itemById.get(itemId);
              if (!item || !Number.isInteger(qty) || qty <= 0) {
                errors.push({ itemId, error: 'Invalid item or qty' });
                continue;
              }

              const have = avail.get(itemId) ?? 0;
              let direct = Math.min(qty, have);
              let need = qty - direct;

              if (need === 0) {
                avail.set(itemId, have - direct);
                plan.push({
                  itemId,
                  itemName: item.name,
                  requestedQty: qty,
                  transferQty: qty,
                  direct,
                  needToCraft: 0,
                  requirements: [],
                  note: 'FULL',
                });
                continue;
              }

              const recipe = item.recipesOf ?? [];
              if (!recipe.length) {
                if (!allowPartial) {
                  errors.push({ itemId, status: 'INSUFFICIENT_STOCK_AND_NO_RECIPE' });
                  continue;
                }
                avail.set(itemId, have - direct);
                plan.push({
                  itemId,
                  itemName: item.name,
                  requestedQty: qty,
                  transferQty: direct,
                  direct,
                  needToCraft: 0,
                  requirements: [],
                  note: 'PARTIAL_READY_ONLY',
                });
                continue;
              }

              const craftable = Math.min(
                ...recipe.map((r) =>
                  Math.floor((avail.get(r.componentItemId) ?? 0) / Number(r.qty) || 0),
                ),
              );
              if (craftable < need) {
                if (!allowPartial) {
                  errors.push({ itemId, status: 'INSUFFICIENT_STOCK_AND_COMPONENTS' });
                  continue;
                }
                need = Math.max(0, Math.floor(craftable));
              }

              const reqs = recipe.map((r) => ({
                componentId: r.componentItemId,
                required: Number(r.qty) * need,
              }));
              if (reqs.some((r) => (avail.get(r.componentId) ?? 0) < r.required)) {
                errors.push({ itemId, status: 'INSUFFICIENT_COMPONENTS_DURING_RESERVATION' });
                continue;
              }

              reqs.forEach((r) =>
                avail.set(r.componentId, (avail.get(r.componentId) ?? 0) - r.required),
              );
              avail.set(itemId, (avail.get(itemId) ?? 0) - direct);

              const transferQty = direct + need;
              plan.push({
                itemId,
                itemName: item.name,
                requestedQty: qty,
                transferQty,
                direct,
                needToCraft: need,
                requirements: reqs,
                note: transferQty < qty ? 'PARTIAL' : 'FULL',
              });
            }

            if (!plan.length) return { ok: false, errors };

            const dec = new Map<string, number>();
            for (const p of plan) {
              if (p.direct) dec.set(p.itemId, (dec.get(p.itemId) ?? 0) + p.direct);
              for (const r of p.requirements)
                dec.set(r.componentId, (dec.get(r.componentId) ?? 0) + r.required);
            }

            {
              const ops: Promise<any>[] = [];
              for (const [itemId, d] of dec) {
                ops.push(
                  tx.inventory.upsert({
                    where: { userId_itemId: { userId: userFromId, itemId } },
                    update: { units: { decrement: d } },
                    create: { userId: userFromId, itemId, units: -d },
                  }),
                );
              }
              await Promise.all(ops);
            }

            const txRows2 = plan.map((p) => ({
              id: randomUUID(),
              fromUserId: userFromId,
              toUserId: userToId,
              itemId: p.itemId,
              units: p.transferQty,
              status: TransactionStatus.pending,
            }));
            await tx.transaction.createMany({ data: txRows2 });
            const ids2 = txRows2.map((r) => r.id);
            const created = await tx.transaction.findMany({
              where: { id: { in: ids2 } },
              select: {
                id: true,
                fromUserId: true,
                toUserId: true,
                itemId: true,
                units: true,
                status: true,
                createdAt: true,
                finishedAt: true,
                item: { select: { id: true, name: true, sku: true } },
                fromUser: { select: { id: true, name: true } },
                toUser: { select: { id: true, name: true } },
              },
            });

            const snapshot = Array.from(new Set([...dec.keys()])).map((id) => ({
              itemId: id,
              unitsLeft: avail.get(id) ?? 0,
            }));
            return { ok: true, created, transferPlan: plan, errors, snapshot } as any;
          }, { timeout: 20000, maxWait: 5000 });

          if (!txResult.ok) return res.status(409).json(txResult);
          if (light) {
            return res.status(200).json(txResult);
          }
          // fetch updated inventories for sender after decrement
          const inventoriesFrom = await prisma.inventory.findMany({
            where: { userId: userFromId },
            include: { item: true },
          });
          return res.status(200).json({ ...txResult, inventoriesFrom });
        } catch (err: any) {
          const msg = String(err?.message ?? err);
          if (msg.startsWith('INSUFFICIENT_STOCK_AT_COMMIT:'))
            return res
              .status(409)
              .json({
                ok: false,
                status: 'INSUFFICIENT_STOCK_AT_COMMIT',
                details: msg.split(':')[1],
              });
          console.error('POST /transfer failed:', err);
          return res.status(500).json({ error: 'Internal Server Error', detail: msg });
        }
      }

      case 'PATCH': {
        try {
          const { transferId, userId } = req.body ?? {};
          if (!transferId) return res.status(400).json({ error: 'transferId is required' });

          const [userTo, transfer] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.transaction.findUnique({ where: { id: transferId } }),
          ]);
          if (!userTo || !transfer) return res.status(404).json({ error: 'User not found' });

          // apply and return updated data in a single tx
          const { updated, inventories } = await prisma.$transaction(async (tx) => {
            const toInv = await tx.inventory.findFirst({
              where: { userId: userTo.id, itemId: transfer.itemId },
            });
            if (toInv) {
              await tx.inventory.update({
                where: { id: toInv.id },
                data: { units: { increment: transfer.units } },
              });
            } else {
              await tx.inventory.create({
                data: { userId: userTo.id, itemId: transfer.itemId, units: transfer.units },
              });
            }
            await tx.transaction.update({
              where: { id: transfer.id },
              data: { status: 'accepted', finishedAt: new Date() },
            });
            const updated = await tx.transaction.findUnique({
              where: { id: transfer.id },
              select: {
                id: true,
                fromUserId: true,
                toUserId: true,
                itemId: true,
                units: true,
                status: true,
                createdAt: true,
                finishedAt: true,
                item: { select: { id: true, name: true, sku: true } },
                fromUser: { select: { id: true, name: true } },
                toUser: { select: { id: true, name: true } },
              },
            });
            const inventories = await tx.inventory.findMany({
              where: { userId: userTo.id },
              include: { item: true },
            });
            return { updated, inventories };
          });

          return res.status(200).json({ ok: true, transfer: updated, inventories });
        } catch (e: any) {
          console.log('PATCH /api/transfer failed:', e.message);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      }

      case 'DELETE': {
        try {
          const { transferId, userId } = req.body ?? {};
          if (!transferId || !userId)
            return res.status(400).json({ error: 'transferId and userId are required' });

          const [user, trans] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.transaction.findUnique({ where: { id: transferId } }),
          ]);
          if (!user || !trans)
            return res.status(400).json({ error: 'transferId and userId are required' });

          const { updated, inventories } = await prisma.$transaction(async (tx) => {
            // Вернуть товары отправителю (fromUser)
            const fromInv = await tx.inventory.findFirst({
              where: { userId: trans.fromUserId, itemId: trans.itemId },
            });
            if (fromInv) {
              await tx.inventory.update({
                where: { id: fromInv.id },
                data: { units: { increment: trans.units } },
              });
            } else {
              await tx.inventory.create({
                data: { userId: trans.fromUserId, itemId: trans.itemId, units: trans.units },
              });
            }
            await tx.transaction.update({ where: { id: trans.id }, data: { status: 'rejected' } });
            const updated = await tx.transaction.findUnique({
              where: { id: trans.id },
              select: {
                id: true,
                fromUserId: true,
                toUserId: true,
                itemId: true,
                units: true,
                status: true,
                createdAt: true,
                item: { select: { id: true, name: true, sku: true } },
                fromUser: { select: { id: true, name: true } },
                toUser: { select: { id: true, name: true } },
              },
            });
            const inventories = await tx.inventory.findMany({
              where: { userId: trans.fromUserId },
              include: { item: true },
            });
            return { updated, inventories };
          });

          return res.status(200).json({ ok: true, transfer: updated, inventories });
        } catch (e: any) {
          console.log('DELETE /api/transfer failed:', e.message);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      }

      default:
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


