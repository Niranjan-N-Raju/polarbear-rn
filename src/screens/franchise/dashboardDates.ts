export function localDateValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function currentMonthRange() {
  const now = new Date();
  return {
    from: localDateValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: localDateValue(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export function thisWeekRange(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  return { from: localDateValue(start), to: localDateValue(now) };
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
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
