/**
 * Indian Rupee (INR / ₹) Formatting Utility
 * Uses the Indian numbering system (e.g., ₹1,250, ₹1,20,000)
 */

export function formatINR(amount: number | null | undefined, includeDecimals: boolean = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: includeDecimals ? 2 : 0,
    }).format(amount);

    return formatted;
  } catch {
    // Fallback if Intl is not available
    const rounded = includeDecimals ? amount.toFixed(2) : Math.round(amount).toString();
    return `₹${rounded}`;
  }
}

/**
 * Format raw number with Indian numbering commas without currency symbol
 */
export function formatIndianNumber(num: number): string {
  try {
    return new Intl.NumberFormat('en-IN').format(num);
  } catch {
    return num.toLocaleString();
  }
}
