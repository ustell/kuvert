/*
  Warnings:

  - You are about to drop the column `date_finished` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Inventory_userId_itemId_key";

-- AlterTable
ALTER TABLE "public"."Transaction" DROP COLUMN "date_finished",
ADD COLUMN     "meta" JSONB;

-- CreateIndex
CREATE INDEX "Transaction_createdAt_id_idx" ON "public"."Transaction"("createdAt", "id");

-- CreateIndex
CREATE INDEX "Transaction_toUserId_createdAt_idx" ON "public"."Transaction"("toUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_fromUserId_createdAt_idx" ON "public"."Transaction"("fromUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_status_createdAt_idx" ON "public"."Transaction"("status", "createdAt");
