import { addDays, businessDate, dayOfWeek } from '../../utils/businessDate';

export function localDateValue(date = new Date()): string {
  // API dates are local calendar days; toISOString() could shift them across a timezone boundary.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Default ranges follow the Asia/Kolkata business day rather than the device time zone.
export function currentMonthRange(now = new Date()) {
  const [year, month] = businessDate(now).split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return { from: `${prefix}-01`, to: `${prefix}-${String(lastDay).padStart(2, '0')}` };
}

export function thisWeekRange(now = new Date()) {
  const today = businessDate(now);
  return { from: addDays(today, -dayOfWeek(today)), to: today };
}

export function validDateRange(from: string, to: string): boolean {
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  return validDate(from) && validDate(to) && from <= to
    && Date.parse(to) - Date.parse(from) <= 366 * 86400000;
}

export function datesBetween(from: string, to: string): string[] {
  if (!validDateRange(from, to)) return [];
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  // Once dates are date-only strings, UTC iteration avoids skipped/repeated days at DST changes.
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
