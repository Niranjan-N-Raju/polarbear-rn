// The backend's business day is Asia/Kolkata, so "today" must not depend on the device time zone.
export const BUSINESS_TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 330 * 60_000;

let formatter: Intl.DateTimeFormat | null | undefined;

function getFormatter(): Intl.DateTimeFormat | null {
  if (formatter === undefined) {
    try {
      formatter = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      formatter = null;
    }
  }
  return formatter;
}

/** Calendar date (YYYY-MM-DD) of the given instant in the Asia/Kolkata business time zone. */
export function businessDate(now: Date = new Date()): string {
  const intl = getFormatter();
  if (intl) {
    const parts = intl.formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
    const value = `${part('year')}-${part('month')}-${part('day')}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  }
  // India has no DST, so a fixed +05:30 offset is an exact fallback when Intl time zones are unavailable.
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Business month (YYYY-MM) of the given instant. */
export function businessMonth(now: Date = new Date()): string {
  return businessDate(now).slice(0, 7);
}

/** Adds whole days to a YYYY-MM-DD value using UTC arithmetic so DST cannot shift the result. */
export function addDays(value: string, amount: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/** Day of week (0 = Sunday) for a YYYY-MM-DD value. */
export function dayOfWeek(value: string): number {
  return new Date(`${value}T00:00:00Z`).getUTCDay();
}
