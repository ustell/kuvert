// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --- Роли (upsert по name)
  const [rAdmin, rWarehouse, rCourier, rClient] = await Promise.all([
    prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin' } }),
    prisma.role.upsert({ where: { name: 'warehouse' }, update: {}, create: { name: 'warehouse' } }),
    prisma.role.upsert({ where: { name: 'courier' }, update: {}, create: { name: 'courier' } }),
    prisma.role.upsert({ where: { name: 'client' }, update: {}, create: { name: 'client' } }),
  ]);

  // --- Правила передачи (кто кому может)
  await prisma.roleRule.deleteMany();
  await prisma.roleRule.createMany({
    data: [
      { fromRoleId: rWarehouse.id, toRoleId: rCourier.id },
      { fromRoleId: rWarehouse.id, toRoleId: rClient.id },
      { fromRoleId: rCourier.id, toRoleId: rClient.id },
      { fromRoleId: rAdmin.id, toRoleId: rWarehouse.id },
      { fromRoleId: rAdmin.id, toRoleId: rCourier.id },
      { fromRoleId: rAdmin.id, toRoleId: rClient.id },
    ],
    skipDuplicates: true,
  });

  // --- Товары (минимум)
  const [itemA, itemB] = await Promise.all([
    prisma.item.upsert({
      where: { sku: 'SKU-001' },
      update: {},
      create: { sku: 'SKU-001', name: 'Box A' },
    }),
    prisma.item.upsert({
      where: { sku: 'SKU-002' },
      update: {},
      create: { sku: 'SKU-002', name: 'Box B' },
    }),
  ]);

  // --- Рецепт (пример: A = 2×B)
  await prisma.recipe.upsert({
    where: { itemId_componentItemId: { itemId: itemA.id, componentItemId: itemB.id } },
    update: { qty: 2 },
    create: { itemId: itemA.id, componentItemId: itemB.id, qty: 2 },
  });

  // --- Пользователи (пароль = bcrypt("123"))
  const hash123 = bcrypt.hashSync('123', 10);

  const [uWarehouse, uCourier, uClient, uOleg] = await Promise.all([
    prisma.user.upsert({
      where: { phone: '+70000000001' },
      update: {},
      create: {
        name: 'Склад №1',
        phone: '+70000000001',
        password: hash123,
        isActive: true,
        role: { connect: { name: 'warehouse' } }, // коннект по name
      },
    }),
    prisma.user.upsert({
      where: { phone: '+70000000002' },
      update: {},
      create: {
        name: 'Курьер',
        phone: '+70000000002',
        password: hash123,
        isActive: true,
        role: { connect: { name: 'courier' } },
      },
    }),
    prisma.user.upsert({
      where: { phone: '+70000000003' },
      update: {},
      create: {
        name: 'Клиент',
        phone: '+70000000003',
        password: hash123,
        isActive: true,
        role: { connect: { name: 'client' } },
      },
    }),
    prisma.user.upsert({
      where: { phone: '+77084057657' },
      update: {},
      create: {
        name: 'Oleg',
        phone: '+77084057657',
        password: hash123,
        isActive: true,
        role: { connect: { name: 'courier' } },
      },
    }),
  ]);

  // --- Стартовые остатки (необязательно)

  console.log('Seed done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
