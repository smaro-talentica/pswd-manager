-- AlterTable
ALTER TABLE "Item" ADD COLUMN "wrappedDek" BYTEA NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Share_itemId_toUserId_key" ON "Share"("itemId", "toUserId");
