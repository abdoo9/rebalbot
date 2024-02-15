export const calculateFinalAmountAfterFee = (
  fromCurrencyAmount: number,
  exchangeRate: number,
  fee: number,
): number => {
  // Convert the amount from the fromCurrency to the toCurrency using the exchange rate
  const amountInToCurrency = fromCurrencyAmount * exchangeRate;

  // Apply the fee
  const finalAmount = amountInToCurrency - (amountInToCurrency * fee) / 100;

  // Return the final amount
  return finalAmount;
};
