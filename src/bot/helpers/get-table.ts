// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTable(data: any[]) {
  const maxLengths = {
    from: Math.max(...data.map((row) => row.from.length), 4), // 4 is the length of "from"
    to: Math.max(...data.map((row) => row.to.length), 2), // 2 is the length of "to"
    rate: Math.max(...data.map((row) => row.rate.toString().length), 4), // 4 is the length of "rate"
    fee: Math.max(...data.map((row) => row.fee.toString().length), 3), // 3 is the length of "fee"
  };

  let table = `<pre><code>${"from".padEnd(maxLengths.from)} ${"to".padEnd(
    maxLengths.to,
  )} ${"rate".padEnd(maxLengths.rate)} ${"fee".padEnd(
    maxLengths.fee,
  )}\n${"----".padEnd(maxLengths.from)} ${"--".padEnd(
    maxLengths.to,
  )} ${"----".padEnd(maxLengths.rate)} ${"---".padEnd(maxLengths.fee)}\n`;

  // eslint-disable-next-line no-restricted-syntax
  for (const row of data) {
    table += `${row.from.padEnd(maxLengths.from)} ${row.to.padEnd(
      maxLengths.to,
    )} ${row.rate.toString().padEnd(maxLengths.rate)} ${row.fee
      .toString()
      .padEnd(maxLengths.fee)}\n`;
  }

  table += "</code></pre>";
  return table;
}
