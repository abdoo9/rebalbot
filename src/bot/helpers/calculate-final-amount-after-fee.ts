export const calculateFinalAmountAfterFee = (
  fromCurrencyAmount: number,
  exchangeRate: number,
  fee: number,
  feeThreshold: number,
): number => {
  if (fromCurrencyAmount < feeThreshold) {
    return (fromCurrencyAmount - fee) * exchangeRate;
  }
  return fromCurrencyAmount * exchangeRate;
};
