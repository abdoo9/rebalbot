export function formatNumber(number_: number): string {
  return number_.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}
