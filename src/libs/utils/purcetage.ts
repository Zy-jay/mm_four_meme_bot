export const getPurcetage = (oldValue: number, newValue: number) => {
  return ((newValue - oldValue) / oldValue) * 100;
};

export const addPurcetage = (value: number, purcents: number) => {
  return value + (value * purcents) / 100;
};

export const substractPurcetage = (value: number, purcents: number) => {
  return value - (value * purcents) / 100;
};

export const getPurcetageFromValue = (value: number, purcentValue: number) => {
  return (purcentValue / value) * 100;
};
