// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ---------- Полная очистка БД (сначала зависимые таблицы)
  await prisma.$transaction(
    [
      // Порядок важен: сначала "многие-к-одному"/дети
      prisma.transaction?.deleteMany?.() as any, // если есть модель Transaction
      prisma.inventory?.deleteMany?.() as any, // если есть модель Inventory
      prisma.recipe.deleteMany(),
      prisma.item.deleteMany(),
      prisma.roleRule.deleteMany(),
      prisma.user.deleteMany(),
      prisma.role.deleteMany(),
    ].filter(Boolean as any),
  );

  const [rAdmin, rWarehouse, rPicker] = await Promise.all([
    prisma.role.create({ data: { name: 'admin' } }),
    prisma.role.create({ data: { name: 'warehouse' } }), // склад
    prisma.role.create({ data: { name: 'picker' } }), // сборщик
  ]);

  await prisma.roleRule.createMany({
    data: [
      // admin -> admin/warehouse/picker
      { fromRoleId: rAdmin.id, toRoleId: rAdmin.id },
      { fromRoleId: rAdmin.id, toRoleId: rWarehouse.id },
      { fromRoleId: rAdmin.id, toRoleId: rPicker.id },

      // склад -> сборщик
      { fromRoleId: rWarehouse.id, toRoleId: rPicker.id },
      // сборщик -> склад
      { fromRoleId: rPicker.id, toRoleId: rWarehouse.id },
    ],
    skipDuplicates: true,
  });

  const hash123 = bcrypt.hashSync('123', 10);

  const [uAdmin] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin',
        phone: '+77084057657',
        password: hash123,
        isActive: true,
        roleId: rAdmin.id,
      },
    }),
  ]);

  console.log('✅ Seed done');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
