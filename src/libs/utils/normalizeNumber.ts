export function normalizeNumber(num: number): string {
  if (!num.toString().includes("e")) return num.toString();
  // Convert to decimal string without scientific notation
  const str = num.toFixed(20);

  // Remove trailing zeros after decimal point
  const trimmed = str.replace(/\.?0+$/, "");

  // If the number is very small (contains many leading zeros after decimal)
  if (trimmed.includes(".")) {
    const [integer, decimal] = trimmed.split(".");
    // Remove trailing zeros from decimal part
    const cleanDecimal = decimal.replace(/0+$/, "");

    if (cleanDecimal.length > 0) {
      return `${integer}.${cleanDecimal}`;
    }
    return integer;
  }

  return trimmed;
}

// Usage examples:
// normalizeNumber(8.6e-7)  -> "0.00000086"
// normalizeNumber(1.2e+3)  -> "1200"
// normalizeNumber(0.00230) -> "0.0023"
