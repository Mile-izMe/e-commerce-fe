// The API sends integer minor units as strings (VND: dong, USD: cents).
export function formatPrice(amount: string, currency: string): string {
  try {
    const formatter = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
    });
    const digits = formatter.resolvedOptions().maximumFractionDigits ?? 0;
    const minor = BigInt(amount);
    const divisor = BigInt(10) ** BigInt(digits);
    // Keep the integer part as BigInt so large prices never lose precision.
    return formatter
      .formatToParts(minor / divisor)
      .map((part) =>
        part.type === "fraction"
          ? (minor % divisor).toString().padStart(digits, "0")
          : part.value,
      )
      .join("");
  } catch {
    return `${amount} ${currency}`;
  }
}
