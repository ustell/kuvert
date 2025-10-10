-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleRule" (
    "id" UUID NOT NULL,
    "fromRoleId" UUID NOT NULL,
    "toRoleId" UUID NOT NULL,

    CONSTRAINT "RoleRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" UUID,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inventory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Recipe" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "componentItemId" UUID NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" UUID NOT NULL,
    "fromUserId" UUID NOT NULL,
    "toUserId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "units" INTEGER NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE INDEX "RoleRule_fromRoleId_idx" ON "public"."RoleRule"("fromRoleId");

-- CreateIndex
CREATE INDEX "RoleRule_toRoleId_idx" ON "public"."RoleRule"("toRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleRule_fromRoleId_toRoleId_key" ON "public"."RoleRule"("fromRoleId", "toRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "public"."Item"("sku");

-- CreateIndex
CREATE INDEX "Inventory_userId_idx" ON "public"."Inventory"("userId");

-- CreateIndex
CREATE INDEX "Inventory_itemId_idx" ON "public"."Inventory"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_userId_itemId_key" ON "public"."Inventory"("userId", "itemId");

-- CreateIndex
CREATE INDEX "Recipe_itemId_idx" ON "public"."Recipe"("itemId");

-- CreateIndex
CREATE INDEX "Recipe_componentItemId_idx" ON "public"."Recipe"("componentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_itemId_componentItemId_key" ON "public"."Recipe"("itemId", "componentItemId");

-- CreateIndex
CREATE INDEX "Transaction_fromUserId_idx" ON "public"."Transaction"("fromUserId");

-- CreateIndex
CREATE INDEX "Transaction_toUserId_idx" ON "public"."Transaction"("toUserId");

-- CreateIndex
CREATE INDEX "Transaction_itemId_idx" ON "public"."Transaction"("itemId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "public"."Transaction"("status");

-- AddForeignKey
ALTER TABLE "public"."RoleRule" ADD CONSTRAINT "RoleRule_fromRoleId_fkey" FOREIGN KEY ("fromRoleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleRule" ADD CONSTRAINT "RoleRule_toRoleId_fkey" FOREIGN KEY ("toRoleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recipe" ADD CONSTRAINT "Recipe_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recipe" ADD CONSTRAINT "Recipe_componentItemId_fkey" FOREIGN KEY ("componentItemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
