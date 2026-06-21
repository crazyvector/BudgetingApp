import { format, parseISO, isValid } from "date-fns";

/**
 * Format a number as currency (RON).
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a compact currency for chart labels.
 */
export function formatCompactCurrency(amount) {
  if (Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatCurrency(amount);
}

/**
 * Format a date string to a readable format.
 */
export function formatDate(dateStr, fmt = "MMM d, yyyy") {
  if (!dateStr) return "—";
  const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
  return isValid(date) ? format(date, fmt) : "—";
}

/**
 * Format a date for input[type=date] value.
 */
export function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
  return isValid(date) ? format(date, "yyyy-MM-dd") : "";
}

/**
 * Get percentage and return clamped 0–100.
 */
export function getPercentage(value, total) {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

/**
 * Get budget status color based on percentage consumed.
 */
export function getBudgetStatus(spent, limit) {
  const pct = getPercentage(spent, limit);
  if (pct >= 90) return { color: "#EF4444", label: "Over budget", level: "danger" };
  if (pct >= 70) return { color: "#F59E0B", label: "Warning", level: "warning" };
  return { color: "#10B981", label: "On track", level: "success" };
}
