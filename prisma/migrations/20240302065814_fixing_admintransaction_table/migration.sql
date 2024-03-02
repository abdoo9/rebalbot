/*
  Warnings:

  - You are about to drop the column `amount` on the `admin_transactions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "admin_transactions" DROP CONSTRAINT "admin_transactions_admin_id_fkey";

-- AlterTable
ALTER TABLE "admin_transactions" DROP COLUMN "amount",
ALTER COLUMN "admin_id" SET DATA TYPE BIGINT;

-- AddForeignKey
ALTER TABLE "admin_transactions" ADD CONSTRAINT "admin_transactions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("telegram_id") ON DELETE RESTRICT ON UPDATE CASCADE;
