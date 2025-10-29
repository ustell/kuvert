-- DropIndex
DROP INDEX "public"."Inventory_userId_itemId_key";

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "date_finished" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
