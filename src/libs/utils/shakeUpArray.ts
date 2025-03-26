export function shakeUpArray<T>(list: T[], first?: number) {
  if (!list) return [];
  return list.sort(() => Math.random() - 0.5).slice(0, first ?? list.length);
}
