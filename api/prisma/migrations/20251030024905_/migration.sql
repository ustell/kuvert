/*
  Warnings:

  - A unique constraint covering the columns `[userId,itemId]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Inventory_userId_itemId_key" ON "public"."Inventory"("userId", "itemId");

-- CreateIndex
CREATE INDEX "Item_name_idx" ON "public"."Item"("name");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "public"."User"("name");
