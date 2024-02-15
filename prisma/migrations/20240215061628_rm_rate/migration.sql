/*
  Warnings:

  - You are about to drop the column `rate` on the `requests` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "message_id" INTEGER NOT NULL,
    "from_currency" TEXT,
    "to_currency" TEXT,
    "submitted_at" DATETIME,
    "amount" REAL,
    "fee" REAL,
    "final_amount" REAL,
    "description" TEXT,
    "from_wallet" TEXT,
    "transaction_id" TEXT,
    "photo_id" TEXT,
    "exchange_rate" REAL NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_requests" ("amount", "created_at", "description", "exchange_rate", "fee", "final_amount", "from_currency", "from_wallet", "id", "message_id", "photo_id", "submitted_at", "to_currency", "transaction_id", "updated_at", "user_id") SELECT "amount", "created_at", "description", "exchange_rate", "fee", "final_amount", "from_currency", "from_wallet", "id", "message_id", "photo_id", "submitted_at", "to_currency", "transaction_id", "updated_at", "user_id" FROM "requests";
DROP TABLE "requests";
ALTER TABLE "new_requests" RENAME TO "requests";
CREATE UNIQUE INDEX "requests_id_key" ON "requests"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
