/**
 * Indian Mobile Number Formatting & Validation Utility
 * Standard format: +91 XXXXX XXXXX (10 digits)
 */

export function cleanIndianPhoneDigits(input: string, maxTen: boolean = true): string {
  if (!input) return '';
  // Remove all non-digits
  let digits = input.replace(/\D/g, '');

  // If starts with 91 and has 12 digits, strip country code
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // If starts with 0 and has 11 digits, strip leading zero
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Cap at 10 digits if maxTen is true
  return maxTen ? digits.slice(0, 10) : digits;
}

export function formatIndianMobile(input: string, includePrefix: boolean = true): string {
  const digits = cleanIndianPhoneDigits(input, true);
  if (!digits) return '';

  let formatted = '';
  if (digits.length <= 5) {
    formatted = digits;
  } else {
    formatted = `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  return includePrefix ? `+91 ${formatted}`.trim() : formatted;
}

export function isValidIndianMobile(input: string): boolean {
  if (!input) return false;
  const digits = cleanIndianPhoneDigits(input, false);
  // Indian mobile numbers typically begin with 6, 7, 8, or 9 and are exactly 10 digits long
  return digits.length === 10 && /^[6-9]\d{9}$/.test(digits);
}

/**
 * Capitalizes names with proper case
 * e.g. "alex gourmet" -> "Alex Gourmet"
 */
export function capitalizeName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
