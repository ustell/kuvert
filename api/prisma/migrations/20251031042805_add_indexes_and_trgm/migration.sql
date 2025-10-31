-- DropIndex
DROP INDEX "public"."idx_item_name_id";

-- DropIndex
DROP INDEX "public"."idx_item_name_trgm";

-- DropIndex
DROP INDEX "public"."idx_item_sku_trgm";

-- DropIndex
DROP INDEX "public"."idx_tx_created_id_desc";

-- DropIndex
DROP INDEX "public"."idx_tx_from_created_id_desc";

-- DropIndex
DROP INDEX "public"."idx_tx_item_created_id_desc";

-- DropIndex
DROP INDEX "public"."idx_tx_to_created_id_desc";

-- DropIndex
DROP INDEX "public"."idx_user_name_trgm";

-- CreateIndex
CREATE INDEX "Inventory_userId_id_idx" ON "public"."Inventory"("userId", "id");

-- CreateIndex
CREATE INDEX "User_isActive_name_idx" ON "public"."User"("isActive", "name");

-- CreateIndex
CREATE INDEX "User_roleId_isActive_name_idx" ON "public"."User"("roleId", "isActive", "name");
