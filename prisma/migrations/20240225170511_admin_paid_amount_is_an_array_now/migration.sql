/*
  Warnings:

  - The `admin_paid_amount` column on the `requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "requests" DROP COLUMN "admin_paid_amount",
ADD COLUMN     "admin_paid_amount" DOUBLE PRECISION[];
