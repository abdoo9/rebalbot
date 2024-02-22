export function startsWithNumberAndDash(string_: string | undefined): boolean {
  const regex = /^\d+-/;
  return regex.test(string_ ?? "");
}
