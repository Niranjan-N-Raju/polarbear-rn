export function formatDateOnly(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDateOnly(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  // Use local noon so UTC conversion and daylight-saving transitions cannot shift the day.
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && formatDateOnly(date) === value ? date : undefined;
}
