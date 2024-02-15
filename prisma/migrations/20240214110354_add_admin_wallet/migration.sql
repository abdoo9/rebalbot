/*
  Warnings:

  - Added the required column `admin_wallet` to the `currencies` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_currencies" (
    "currency" TEXT NOT NULL PRIMARY KEY,
    "sticker" TEXT NOT NULL,
    "admin_wallet" TEXT NOT NULL
);
INSERT INTO "new_currencies" ("currency", "sticker") SELECT "currency", "sticker" FROM "currencies";
DROP TABLE "currencies";
ALTER TABLE "new_currencies" RENAME TO "currencies";
CREATE UNIQUE INDEX "currencies_currency_key" ON "currencies"("currency");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
