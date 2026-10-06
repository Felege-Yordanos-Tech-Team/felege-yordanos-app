/**
 * Member ids in the Sunday School register look like "ssu/01/03/05/00042".
 * Members may type just the number ("42" or "00042"); this fills in the rest.
 */
export const MEMBER_ID_PREFIX = 'ssu/01/03/05/';
const DIGITS = 5;

export function normalizeMemberId(input: string): string {
  const v = input.trim().replace(/\s+/g, '');
  if (/^\d{1,5}$/.test(v)) return MEMBER_ID_PREFIX + v.padStart(DIGITS, '0');
  return v;
}
