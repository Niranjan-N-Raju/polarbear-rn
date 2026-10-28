import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { Alert,useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { type SummaryCardItem } from '../../../components/SummaryCards';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { CalendarDays,CircleCheck,CircleX } from '../../../icons';
import { getAdminLayout } from '../../../utils/adminLayout';
export type AttendanceStatus = 'Present' | 'Week Off' | 'Absent';
export interface AttendanceEmployee {
  _id: string;
  name: string;
  isActive?: boolean;
  dateOfJoining?: string | null;
  archivedAt?: string | null;
}
export type AttendanceRecord = { employeeId: string; date: string; status: AttendanceStatus; comment: string };
export type Cycle = { from: string; to: string; type?: 'calendar_month' | 'custom'; startDay?: number };
export const statuses: AttendanceStatus[] = ['Present', 'Week Off', 'Absent'];
export const statusLabelKey = { Present: 'franchiseAttendancePresent', 'Week Off': 'franchiseAttendanceWeekOff', Absent: 'franchiseAttendanceAbsent' } as const;
export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function currentMonth() {
  return localDate(new Date()).slice(0, 7);
}
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
export interface FranchiseAttendanceScreenProps { storeId: string }

export function useFranchiseAttendance({ storeId }: FranchiseAttendanceScreenProps) {
const { width } = useWindowDimensions();
const layout = getAdminLayout(width);
const [period, setPeriod] = useState(currentMonth);
const [cycle, setCycle] = useState<Cycle | null>(null);
const [employees, setEmployees] = useState<AttendanceEmployee[]>([]);
const [records, setRecords] = useState<AttendanceRecord[]>([]);
const [selectedDate, setSelectedDate] = useState(localDate(new Date()));
const selectedDateRef = useRef(selectedDate);
selectedDateRef.current = selectedDate;
const [employeeFilter, setEmployeeFilter] = useState('all');
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [reloadKey, setReloadKey] = useState(0);
const [updatingId, setUpdatingId] = useState<string | null>(null);
const [drawer, setDrawer] = useState<'filters' | 'roster' | null>(null);
const [toast, setToast] = useState<string | null>(null);
const [toastTone, setToastTone] = useState<'success' | 'error'>('success');
const load = useCallback(async (signal: AbortSignal) => {
    if (!storeId) {
      setEmployees([]);
      setRecords([]);
      setCycle(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const employeeQuery = new URLSearchParams({ franchiseId: storeId, includeArchived: 'true', limit: '500' });
      const cycleQuery = new URLSearchParams({ franchiseId: storeId, period });
      const [employeeResponse, cycleResponse] = await Promise.all([
        apiRequest(`/users?${employeeQuery.toString()}`, { signal }),
        apiRequest(`/stores/cycle?${cycleQuery.toString()}`, { signal }),
      ]);
      const employeeData = await employeeResponse.json().catch(() => ({})) as { users?: AttendanceEmployee[]; message?: string };
      const cycleData = await cycleResponse.json().catch(() => ({})) as { cycle?: Cycle; message?: string };
      if (!employeeResponse.ok) throw new Error(employeeData.message || t('adminLoadFailed'));
      if (!cycleResponse.ok || !cycleData.cycle) throw new Error(cycleData.message || t('adminLoadFailed'));
      const nextCycle = cycleData.cycle;
      const attendanceQuery = new URLSearchParams({ storeId, from: nextCycle.from, to: nextCycle.to });
      const attendanceResponse = await apiRequest(`/attendance?${attendanceQuery.toString()}`, { signal });
      const attendanceData = await attendanceResponse.json().catch(() => ({})) as { records?: AttendanceRecord[]; message?: string };
      if (!attendanceResponse.ok) throw new Error(attendanceData.message || t('adminLoadFailed'));
      if (signal.aborted) return;
      const nextEmployees = employeeData.users ?? [];
      setEmployees(nextEmployees);
      setCycle(nextCycle);
      setRecords(attendanceData.records ?? []);
      if (selectedDateRef.current < nextCycle.from || selectedDateRef.current > nextCycle.to) {
        const today = localDate(new Date());
        setSelectedDate(today >= nextCycle.from && today <= nextCycle.to ? today : nextCycle.from);
      }
    } catch (loadError) {
      if (!signal.aborted) setError(loadError instanceof Error ? loadError.message : t('adminNetworkError'));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [period, storeId]);
useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);
const periodDates = useMemo(() => cycle ? datesBetween(cycle.from, cycle.to) : [], [cycle]);
const visibleEmployees = useMemo(() => employees
    .filter((employee) => employeeFilter === 'all' || employee._id === employeeFilter)
    .filter((employee) => isActiveOn(employee, selectedDate))
    .sort((a, b) => a.name.localeCompare(b.name)), [employeeFilter, employees, selectedDate]);
const dayRecords = records.filter((record) => record.date === selectedDate && (employeeFilter === 'all' || record.employeeId === employeeFilter));
const periodRecords = records.filter((record) => employeeFilter === 'all' || record.employeeId === employeeFilter);
const dayCounts = statuses.map((status) => dayRecords.filter((record) => record.status === status).length);
const periodCounts = statuses.map((status) => periodRecords.filter((record) => record.status === status).length);
const summaryCards: SummaryCardItem[] = [
    { label: t('franchiseAttendancePresent'), value: String(dayCounts[0]), color: theme.colors.teal, Icon: CircleCheck },
    { label: t('franchiseAttendanceWeekOff'), value: String(dayCounts[1]), color: theme.colors.orange, Icon: CalendarDays },
    { label: t('franchiseAttendanceAbsent'), value: String(dayCounts[2]), color: theme.colors.error, Icon: CircleX },
    { label: `${t('franchiseAttendancePresent')} · ${t('franchiseAttendanceSummaryPeriod')}`, value: String(periodCounts[0]), color: theme.colors.teal, Icon: CircleCheck },
    { label: `${t('franchiseAttendanceWeekOff')} · ${t('franchiseAttendanceSummaryPeriod')}`, value: String(periodCounts[1]), color: theme.colors.orange, Icon: CalendarDays },
    { label: `${t('franchiseAttendanceAbsent')} · ${t('franchiseAttendanceSummaryPeriod')}`, value: String(periodCounts[2]), color: theme.colors.error, Icon: CircleX },
  ];
const changeDate = (amount: number) => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + amount);
    const next = localDate(date);
    setSelectedDate(next);
    if (cycle && (next < cycle.from || next > cycle.to)) setPeriod(next.slice(0, 7));
  };
async function updateStatus(employee: AttendanceEmployee, status: AttendanceStatus) {
    const existing = records.find((record) => record.date === selectedDate && record.employeeId === employee._id);
    if (existing?.status === status || updatingId) return;
    setUpdatingId(employee._id);
    try {
      const response = await apiRequest('/attendance', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, date: selectedDate, records: [{ employeeId: employee._id, status, comment: existing?.comment ?? '' }] }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message || t('adminSaveFailed'));
      setRecords((current) => existing
        ? current.map((record) => record.date === selectedDate && record.employeeId === employee._id ? { ...record, status } : record)
        : [...current, { employeeId: employee._id, date: selectedDate, status, comment: '' }]);
      setToastTone('success');
      setToast(data.message || t('franchiseAttendanceMarked'));
    } catch (saveError) {
      setToastTone('error');
      setToast(saveError instanceof Error ? saveError.message : t('adminNetworkError'));
    } finally { setUpdatingId(null); }
  }
function removeRecord(employee: AttendanceEmployee) {
    Alert.alert(t('franchiseAttendanceRemove'), employee.name, [
      { text: t('adminCancel'), style: 'cancel' },
      { text: t('franchiseAttendanceRemove'), style: 'destructive', onPress: async () => {
          try {
            const query = new URLSearchParams({ storeId, date: selectedDate, employeeId: employee._id });
            const response = await apiRequest(`/attendance?${query.toString()}`, { method: 'DELETE' });
            const data = await response.json().catch(() => ({})) as { message?: string };
            if (!response.ok) throw new Error(data.message || t('adminSaveFailed'));
            setRecords((current) => current.filter((record) => !(record.date === selectedDate && record.employeeId === employee._id)));
            setToastTone('success');
            setToast(data.message || t('franchiseAttendanceRemoved'));
          } catch (removeError) { setToastTone('error'); setToast(removeError instanceof Error ? removeError.message : t('adminNetworkError')); }
      } },
    ]);
  }
return { layout, period, setPeriod, cycle, employees, records, selectedDate, setSelectedDate, employeeFilter, setEmployeeFilter, loading, error, setReloadKey, updatingId, drawer, setDrawer, toast, setToast, toastTone, setToastTone, periodDates, visibleEmployees, summaryCards, changeDate, updateStatus, removeRecord };
}
