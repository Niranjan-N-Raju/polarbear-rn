import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { type SummaryCardItem } from '../../../components/SummaryCards';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { CalendarDays, CircleCheck, CircleX } from '../../../icons';
import { getAdminLayout } from '../../../utils/adminLayout';
import { AttendanceEmployee, AttendanceRecord, AttendanceStatus, currentMonth, Cycle, datesBetween, isActiveOn, localDate, statuses } from './attendanceUtils';
import { businessDate } from '../../../utils/businessDate';
export interface FranchiseAttendanceScreenProps { storeId: string; }
export function useFranchiseAttendance({ storeId }: FranchiseAttendanceScreenProps) {
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [period, setPeriod] = useState(currentMonth);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [employees, setEmployees] = useState<AttendanceEmployee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => businessDate());
  // Read the latest selected day after loading without making day navigation refetch the whole cycle.
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
      const employeeData = await employeeResponse.json().catch(() => ({})) as { users?: AttendanceEmployee[]; message?: string; };
      const cycleData = await cycleResponse.json().catch(() => ({})) as { cycle?: Cycle; message?: string; };
      if (!employeeResponse.ok) throw new Error(employeeData.message || t('adminLoadFailed'));
      if (!cycleResponse.ok || !cycleData.cycle) throw new Error(cycleData.message || t('adminLoadFailed'));
      const nextCycle = cycleData.cycle;
      // Custom salary cycles may cross calendar months; load attendance for the server-resolved bounds.
      const attendanceQuery = new URLSearchParams({ storeId, from: nextCycle.from, to: nextCycle.to });
      const attendanceResponse = await apiRequest(`/attendance?${attendanceQuery.toString()}`, { signal });
      const attendanceData = await attendanceResponse.json().catch(() => ({})) as { records?: AttendanceRecord[]; message?: string; };
      if (!attendanceResponse.ok) throw new Error(attendanceData.message || t('adminLoadFailed'));
      if (signal.aborted) return;
      const nextEmployees = employeeData.users ?? [];
      setEmployees(nextEmployees);
      setCycle(nextCycle);
      setRecords(attendanceData.records ?? []);
      if (selectedDateRef.current < nextCycle.from || selectedDateRef.current > nextCycle.to) {
        const today = businessDate();
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
    // Archived employees can still appear on dates before their exit.
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
    // Serialize marks globally so rapid taps cannot issue overlapping status changes.
    if (existing?.status === status || updatingId) return;
    setUpdatingId(employee._id);
    try {
      const response = await apiRequest('/attendance', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, date: selectedDate, records: [{ employeeId: employee._id, status, comment: existing?.comment ?? '' }] }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string; };
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
  // Alert.alert buttons are no-ops on react-native-web, so removal is confirmed through ConfirmDrawer.
  const [removeRequest, setRemoveRequest] = useState<{ employee: AttendanceEmployee; date: string } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  function removeRecord(employee: AttendanceEmployee) {
    setRemoveError(null);
    setRemoveRequest({ employee, date: selectedDate });
  }
  function cancelRemove() {
    if (removing) return;
    setRemoveRequest(null);
    setRemoveError(null);
  }
  async function confirmRemove() {
    if (!removeRequest || removing) return;
    const { employee, date } = removeRequest;
    setRemoving(true);
    setRemoveError(null);
    try {
      const query = new URLSearchParams({ storeId, date, employeeId: employee._id });
      const response = await apiRequest(`/attendance?${query.toString()}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({})) as { message?: string; };
      if (!response.ok) throw new Error(data.message || t('adminSaveFailed'));
      setRecords((current) => current.filter((record) => !(record.date === date && record.employeeId === employee._id)));
      setRemoveRequest(null);
      setToastTone('success');
      setToast(data.message || t('franchiseAttendanceRemoved'));
    } catch (removeFailure) {
      setRemoveError(removeFailure instanceof Error ? removeFailure.message : t('adminNetworkError'));
    } finally {
      setRemoving(false);
    }
  }
  return {
    layout,
    period,
    setPeriod,
    cycle,
    employees,
    records,
    selectedDate,
    setSelectedDate,
    employeeFilter,
    setEmployeeFilter,
    loading,
    error,
    setReloadKey,
    updatingId,
    drawer,
    setDrawer,
    toast,
    setToast,
    toastTone,
    setToastTone,
    periodDates,
    visibleEmployees,
    summaryCards,
    changeDate,
    updateStatus,
    removeRecord,
    removeRequest,
    removing,
    removeError,
    setRemoveError,
    cancelRemove,
    confirmRemove,
  };
}
