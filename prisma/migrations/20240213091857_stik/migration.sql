/*
  Warnings:

  - You are about to drop the column `image` on the `currencies` table. All the data in the column will be lost.
  - Added the required column `sticker` to the `currencies` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_currencies" (
    "currency" TEXT NOT NULL PRIMARY KEY,
    "sticker" TEXT NOT NULL
);
INSERT INTO "new_currencies" ("currency") SELECT "currency" FROM "currencies";
DROP TABLE "currencies";
ALTER TABLE "new_currencies" RENAME TO "currencies";
CREATE UNIQUE INDEX "currencies_currency_key" ON "currencies"("currency");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
