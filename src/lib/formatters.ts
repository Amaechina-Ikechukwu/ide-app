const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "\u20A6",
  USD: "$",
};

export function stripNumericFormatting(value: string) {
  return value.replace(/,/g, "").trim();
}

export function formatAmountInput(value: string) {
  const sanitized = value.replace(/[^\d.]/g, "");
  if (!sanitized) return "";

  const [integerPart = "", ...decimalParts] = sanitized.split(".");
  const hasDecimal = sanitized.includes(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (!hasDecimal) {
    return formattedInteger;
  }

  return `${formattedInteger || "0"}.${decimalParts.join("")}`;
}

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
