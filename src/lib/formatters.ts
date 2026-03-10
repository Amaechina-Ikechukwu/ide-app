const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "\u20A6",
  USD: "$",
};

export function formatCurrency(
  amount: number,
  currency = "NGN",
  minimumFractionDigits?: number,
) {
  const normalizedCurrency = currency.toUpperCase();
  const symbol = CURRENCY_SYMBOLS[normalizedCurrency] ?? `${normalizedCurrency} `;
  const digits = minimumFractionDigits ?? (Number.isInteger(amount) ? 0 : 2);

  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}
