import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Banknote, Gift, IndianRupee, Wallet } from '../../../icons';
import { getAdminLayout } from '../../../utils/adminLayout';
import { formatMoney } from '../DashboardCharts';
import { currentMonthValue as todayPeriod } from '../shared/months';
import { type SalaryEntry, type SalaryEntryKind } from './SalaryEntryDrawer';
import { Projection, SalaryData, SlipData } from './types';
export const entryKinds: SalaryEntryKind[] = ['advances', 'incentives', 'extra-days'];
export const kindLabel: Record<SalaryEntryKind, Parameters<typeof t>[0]> = { advances: 'franchiseSalaryAdvance', incentives: 'franchiseSalaryIncentive', 'extra-days': 'franchiseSalaryExtraDay' };
export function useFranchiseSalary({ storeId }: { storeId: string; }) {
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [period, setPeriod] = useState(todayPeriod);
  const [data, setData] = useState<SalaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCycleOpen, setIsCycleOpen] = useState(false);
  const [cycleType, setCycleType] = useState<'calendar_month' | 'custom'>('calendar_month');
  const [startDay, setStartDay] = useState('2');
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [savingCycle, setSavingCycle] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Projection | null>(null);
  const [slip, setSlip] = useState<SlipData | null>(null);
  const [slipBusy, setSlipBusy] = useState(false);
  const [queuedDrawerAction, setQueuedDrawerAction] = useState<{ type: 'entry'; employeeId: string; kind: SalaryEntryKind; entry: SalaryEntry | null; } | { type: 'delete'; employeeId: string; kind: SalaryEntryKind; entry: SalaryEntry; } | null>(null);
  const [entryRequest, setEntryRequest] = useState<{ employeeId: string; kind: SalaryEntryKind; entry: SalaryEntry | null; } | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<{ employeeId: string; kind: SalaryEntryKind; entry: SalaryEntry; } | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingToast, setPendingToast] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const reload = useCallback(() => setReloadKey((current) => current + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setIsLoading(true); setError(null);
    const query = new URLSearchParams({ storeId, period });
    apiRequest(`/salary?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as SalaryData & { message?: string; };
        if (!active) return;
        if (!response.ok) { setError(result.message ?? t('adminLoadFailed')); return; }
        setData(result); setCycleType(result.cycle.type); setStartDay(String(result.cycle.startDay));
      })
      .catch(() => { if (active) setError(t('adminNetworkError')); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [storeId, period, reloadKey]);
  const projections = useMemo(() => data?.projections ?? [], [data]);
  // Display server-calculated payroll; duplicating its attendance/cycle rules here would risk drift.
  const totals = useMemo(() => projections.reduce((sum, item) => ({ base: sum.base + item.salary, earned: sum.earned + item.earnedSalary, projected: sum.projected + item.projectedSalary, incentives: sum.incentives + item.incentiveTotal }), { base: 0, earned: 0, projected: 0, incentives: 0 }), [projections]);
  const cards = [
    { label: t('franchiseSalaryBase'), value: formatMoney(totals.base), color: theme.colors.teal, Icon: IndianRupee },
    { label: t('franchiseSalaryEarned'), value: formatMoney(totals.earned), color: theme.colors.orange, Icon: Wallet },
    { label: t('franchiseSalaryProjected'), value: formatMoney(totals.projected), color: theme.colors.teal, Icon: Banknote },
    { label: t('franchiseSalaryIncentivesTotal'), value: formatMoney(totals.incentives), color: theme.colors.orange, Icon: Gift },
  ];
  const summaryRows = layout.desktopWeb ? [cards] : [cards.slice(0, 2), cards.slice(2)];
  // Slip responses are dropped once the employee changes or the slip/drawer is closed.
  const slipControllerRef = useRef<AbortController | null>(null);
  const cancelSlipRequest = useCallback(() => {
    slipControllerRef.current?.abort();
    slipControllerRef.current = null;
    setSlipBusy(false);
  }, []);
  useEffect(() => () => slipControllerRef.current?.abort(), []);
  const selectEmployee = useCallback((employee: Projection | null) => {
    cancelSlipRequest();
    setSelectedEmployee(employee);
  }, [cancelSlipRequest]);
  const updateSlip = useCallback((next: SlipData | null) => {
    if (!next) cancelSlipRequest();
    setSlip(next);
  }, [cancelSlipRequest]);
  const openSlip = async (employee: Projection) => {
    slipControllerRef.current?.abort();
    const controller = new AbortController();
    slipControllerRef.current = controller;
    setSelectedEmployee(employee); setSlip(null); setSlipBusy(true);
    try {
      const query = new URLSearchParams({ storeId, employeeId: employee.employeeId, period });
      const response = await apiRequest(`/salary/slip?${query.toString()}`, { signal: controller.signal });
      const result = await response.json().catch(() => ({})) as SlipData & { message?: string; };
      if (controller.signal.aborted) return;
      if (!response.ok) { setToast(result.message ?? t('franchiseSalarySlipFailed')); return; }
      setSlip(result);
    } catch { if (!controller.signal.aborted) setToast(t('adminNetworkError')); }
    finally {
      if (slipControllerRef.current === controller) {
        slipControllerRef.current = null;
        setSlipBusy(false);
      }
    }
  };
  const saveCycle = async () => {
    const day = Number(startDay);
    // Days 2-28 exist in every month; day 1 is represented by calendar-month mode.
    if (cycleType === 'custom' && (!Number.isInteger(day) || day < 2 || day > 28)) { setCycleError(t('franchiseSalaryCycleDayError')); return; }
    setSavingCycle(true); setCycleError(null);
    try {
      const response = await apiRequest('/salary', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId, cycleType, ...(cycleType === 'custom' ? { startDay: day } : {}) }) });
      const result = await response.json().catch(() => ({})) as { message?: string; };
      if (!response.ok) { setCycleError(result.message ?? t('adminSaveFailed')); return; }
      setIsCycleOpen(false); setToast(result.message ?? t('franchiseSalaryCycleSaved')); reload();
    } catch { setCycleError(t('adminNetworkError')); }
    finally { setSavingCycle(false); }
  };
  const removeEntry = async () => {
    if (!deleteRequest) return;
    setBusyDelete(true);
    try {
      const response = await apiRequest("/" + deleteRequest.kind + "/" + encodeURIComponent(deleteRequest.entry.id) + "?storeId=" + encodeURIComponent(storeId), { method: "DELETE" });

      const result = await response.json().catch(() => ({})) as { message?: string; };
      if (!response.ok) { setDeleteError(result.message ?? t('adminSaveFailed')); return; }
      setDeleteRequest(null); setPendingToast(result.message ?? t('franchiseSalaryEntryRemoved')); setDeleteError(null); reload();
      setSelectedEmployee((current) => current?.employeeId === deleteRequest.employeeId ? null : current);
    } catch { setToast(t('adminNetworkError')); }
    finally { setBusyDelete(false); }
  };
  const findEntry = (employee: Projection, kind: SalaryEntryKind) => kind === 'advances' ? employee.advances : kind === 'incentives' ? employee.incentives : employee.extraDays;
  return {
    layout,
    period,
    setPeriod,
    data,
    isLoading,
    error,
    isCycleOpen,
    setIsCycleOpen,
    cycleType,
    setCycleType,
    startDay,
    setStartDay,
    cycleError,
    savingCycle,
    selectedEmployee,
    setSelectedEmployee: selectEmployee,
    slip,
    setSlip: updateSlip,
    slipBusy,
    queuedDrawerAction,
    setQueuedDrawerAction,
    entryRequest,
    setEntryRequest,
    deleteRequest,
    setDeleteRequest,
    busyDelete,
    toast,
    setToast,
    pendingToast,
    setPendingToast,
    deleteError,
    setDeleteError,
    reload,
    projections,
    summaryRows,
    openSlip,
    saveCycle,
    removeEntry,
    findEntry,
  };
}
