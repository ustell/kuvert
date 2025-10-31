-- DropIndex
DROP INDEX "public"."Transaction_fromUserId_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Transaction_status_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Transaction_toUserId_createdAt_idx";

-- CreateIndex
CREATE INDEX "Transaction_toUserId_createdAt_id_idx" ON "public"."Transaction"("toUserId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Transaction_fromUserId_createdAt_id_idx" ON "public"."Transaction"("fromUserId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Transaction_status_createdAt_id_idx" ON "public"."Transaction"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Transaction_itemId_createdAt_id_idx" ON "public"."Transaction"("itemId", "createdAt", "id");
