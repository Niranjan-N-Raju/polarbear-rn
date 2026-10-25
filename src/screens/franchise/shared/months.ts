import { localDateValue } from '../dashboardDates';

export function currentMonthValue(now = new Date()): string {
  return localDateValue(now).slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(year, monthIndex - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthRange(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` };
}

export function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(year, monthIndex - 1, 1);
  if (Number.isNaN(date.getTime())) return month;
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function formatShortDate(date: string): string {
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return date;
  return value.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
