/*
  Warnings:

  - Added the required column `fee` to the `exchange_rates` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_exchange_rates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "fee" REAL NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_exchange_rates" ("created_at", "from_currency", "id", "rate", "to_currency", "updated_at") SELECT "created_at", "from_currency", "id", "rate", "to_currency", "updated_at" FROM "exchange_rates";
DROP TABLE "exchange_rates";
ALTER TABLE "new_exchange_rates" RENAME TO "exchange_rates";
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_key" ON "exchange_rates"("from_currency", "to_currency");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
