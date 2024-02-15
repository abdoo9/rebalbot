export function generateShortId(): string {
  return Math.random().toString(36).slice(2, 11);
}
