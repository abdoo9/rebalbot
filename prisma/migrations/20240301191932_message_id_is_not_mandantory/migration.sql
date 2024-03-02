-- AlterTable
ALTER TABLE "requests" ALTER COLUMN "message_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "admin_transactions" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "request_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "admin_transactions" ADD CONSTRAINT "admin_transactions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_transactions" ADD CONSTRAINT "admin_transactions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
