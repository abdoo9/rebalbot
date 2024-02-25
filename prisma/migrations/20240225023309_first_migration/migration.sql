-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "contact" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message_id" INTEGER NOT NULL,
    "from_currency" TEXT,
    "to_currency" TEXT,
    "submitted_at" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "fee" DOUBLE PRECISION,
    "fee_threshold" DOUBLE PRECISION,
    "final_amount" DOUBLE PRECISION,
    "description" TEXT,
    "user_receiving_wallet" TEXT,
    "transaction_id" TEXT,
    "photo_id" TEXT,
    "admin_confirmed_receipt" BOOLEAN,
    "admin_paid_amount" DOUBLE PRECISION,
    "exchange_rate" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" SERIAL NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "fee_threshold" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "currency" TEXT NOT NULL,
    "sticker" TEXT NOT NULL,
    "admin_wallet" TEXT NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("currency")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "requests_id_key" ON "requests"("id");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_key" ON "exchange_rates"("from_currency", "to_currency");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_currency_key" ON "currencies"("currency");

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_from_currency_fkey" FOREIGN KEY ("from_currency") REFERENCES "currencies"("currency") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_to_currency_fkey" FOREIGN KEY ("to_currency") REFERENCES "currencies"("currency") ON DELETE RESTRICT ON UPDATE CASCADE;
