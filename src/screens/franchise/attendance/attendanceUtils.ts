export type AttendanceStatus = 'Present' | 'Week Off' | 'Absent';
export interface AttendanceEmployee {
  _id: string;
  name: string;
  isActive?: boolean;
  dateOfJoining?: string | null;
  archivedAt?: string | null;
}
export type AttendanceRecord = { employeeId: string; date: string; status: AttendanceStatus; comment: string; };
export type Cycle = { from: string; to: string; type?: 'calendar_month' | 'custom'; startDay?: number; };
export const statuses: AttendanceStatus[] = ['Present', 'Week Off', 'Absent'];
export const statusLabelKey = { Present: 'franchiseAttendancePresent', 'Week Off': 'franchiseAttendanceWeekOff', Absent: 'franchiseAttendanceAbsent' } as const;
export function datesBetween(from: string, to: string) {
  if (!from || !to || from > to) return [];
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end && dates.length < 45) {
    dates.push(localDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
export function isActiveOn(employee: AttendanceEmployee, date: string) {
  const joined = employee.dateOfJoining ? localDate(new Date(employee.dateOfJoining)) : '';
  if (joined && joined > date) return false;
  if (employee.isActive === false) {
    if (!employee.archivedAt) return false;
    const archived = localDate(new Date(employee.archivedAt));
    if (archived <= date) return false;
  }
  return true;
}
export function dateLabel(value: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(`${value}T00:00:00`));
}
import { localDateValue as localDate } from '../dashboardDates';
export { localDateValue as localDate } from '../dashboardDates';
export { currentMonthValue as currentMonth } from '../shared/months';
