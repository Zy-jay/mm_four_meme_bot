export const parseTon = (value: number | string | undefined) => {
  if (!value) return 0;
  return Math.floor(Number(value) * 10 ** 9);
};
export const formatTon = (value: number | string | undefined) => {
  if (value === undefined || value === null)
    throw new Error("Value is not provided");
  return Number(value) / 10 ** 9;
};
