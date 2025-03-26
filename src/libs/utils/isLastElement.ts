export function isLastElement(element: any, array: any[]) {
  return JSON.stringify(element) === JSON.stringify(array[array.length - 1]);
}
