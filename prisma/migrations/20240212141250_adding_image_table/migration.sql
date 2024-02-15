-- CreateTable
CREATE TABLE "CurrencyImage" (
    "currency" TEXT NOT NULL PRIMARY KEY,
    "image" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyImage_currency_key" ON "CurrencyImage"("currency");
