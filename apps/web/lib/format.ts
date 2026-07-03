/** "May 18" — short month + day, resilient to bad input. */
export function formatShortDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

/** Thousands-separated amount, e.g. 1500 -> "1,500". */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount);
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  telebirr: 'Telebirr',
  cash: 'Cash',
  other: 'Other',
};

/** Human label for a donation payment method (falls back gracefully). */
export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return 'Donation';
  return PAYMENT_METHOD_LABELS[method] ?? 'Donation';
}
