export function findMaxNumber(numbers: number[]): number {
  // Handle empty array
  if (!numbers || numbers.length === 0) {
    throw new Error("Array is empty or invalid");
  }

  // Use Math.max with spread operator to find maximum
  return Math.max(...numbers);
}

// Usage examples:
// findMaxNumber([1, 5, 3, 9, 2])  -> 9
// findMaxNumber([-1, -5, -3])     -> -1
// findMaxNumber([0.1, 0.5, 0.3])  -> 0.5
