// Pages render on servers that run in UTC, so dates are always shown in Indian time.
const timeZone = "Asia/Kolkata";

// "7 Oct 2026, 3:45 pm"
export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { timeZone, dateStyle: "medium", timeStyle: "short" });
}

// "7 Oct 2026". Also used for date-only columns such as due dates ("2026-10-07").
export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { timeZone, dateStyle: "medium" });
}

// "₹50,000" or "$1,200.50": paise and cents only when the amount has them.
export function formatMoney(amount: number | string, currency = "INR") {
  const value = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
