/*
  Warnings:

  - You are about to drop the `CurrencyImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "CurrencyImage_currency_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CurrencyImage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "currencies" (
    "currency" TEXT NOT NULL PRIMARY KEY,
    "image" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_exchange_rates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "fee" REAL NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exchange_rates_from_currency_fkey" FOREIGN KEY ("from_currency") REFERENCES "currencies" ("currency") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exchange_rates_to_currency_fkey" FOREIGN KEY ("to_currency") REFERENCES "currencies" ("currency") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_exchange_rates" ("created_at", "fee", "from_currency", "id", "rate", "to_currency", "updated_at") SELECT "created_at", "fee", "from_currency", "id", "rate", "to_currency", "updated_at" FROM "exchange_rates";
DROP TABLE "exchange_rates";
ALTER TABLE "new_exchange_rates" RENAME TO "exchange_rates";
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_key" ON "exchange_rates"("from_currency", "to_currency");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "currencies_currency_key" ON "currencies"("currency");
