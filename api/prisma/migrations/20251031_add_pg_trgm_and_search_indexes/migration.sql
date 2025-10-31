-- Enable pg_trgm extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for ILIKE searches
CREATE INDEX IF NOT EXISTS idx_user_name_trgm
  ON "public"."User" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_item_name_trgm
  ON "public"."Item" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_item_sku_trgm
  ON "public"."Item" USING gin ("sku" gin_trgm_ops);

-- Covering btree indexes to support common ORDER BY / filters (safety if not in Prisma schema)
CREATE INDEX IF NOT EXISTS idx_item_name_id
  ON "public"."Item" ("name" ASC, "id" ASC);

-- Transaction composite indexes (exist in schema; ensure present if migrating from older dbs)
CREATE INDEX IF NOT EXISTS idx_tx_created_id_desc
  ON "public"."Transaction" ("createdAt" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS idx_tx_from_created_id_desc
  ON "public"."Transaction" ("fromUserId", "createdAt" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS idx_tx_to_created_id_desc
  ON "public"."Transaction" ("toUserId", "createdAt" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS idx_tx_item_created_id_desc
  ON "public"."Transaction" ("itemId", "createdAt" DESC, "id" DESC);
