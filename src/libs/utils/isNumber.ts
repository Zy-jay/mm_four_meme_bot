export function isNumber(value: string | number): boolean {
  return !isNaN(Number(value));
}
