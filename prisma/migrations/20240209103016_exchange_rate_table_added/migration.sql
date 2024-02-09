/*
  Warnings:

  - Added the required column `exchange_rate` to the `requests` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "from_currency" TEXT,
    "to_currency" TEXT,
    "submitted_at" DATETIME,
    "amount" REAL,
    "description" TEXT,
    "exchange_rate" REAL NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_requests" ("amount", "created_at", "description", "from_currency", "id", "submitted_at", "to_currency", "updated_at", "user_id") SELECT "amount", "created_at", "description", "from_currency", "id", "submitted_at", "to_currency", "updated_at", "user_id" FROM "requests";
DROP TABLE "requests";
ALTER TABLE "new_requests" RENAME TO "requests";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
