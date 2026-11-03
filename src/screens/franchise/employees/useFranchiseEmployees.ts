import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { pageSize } from '../../../config/pagination';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Archive, UserRound, UsersRound } from '../../../icons';
import { getAdminLayout } from '../../../utils/adminLayout';
import { businessDate } from '../../../utils/businessDate';
import { type EmployeeStatusFilter } from './EmployeeFiltersDrawer';
export interface Employee {
  _id: string;
  employeeCode?: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  employmentType?: 'full_time' | 'part_time';
  salary?: number | null;
  latestSalary?: number | null;
  paidLeaveBalance?: number;
  paidLeaveEligible?: boolean;
  dateOfJoining?: string;
  isActive?: boolean;
  archivedAt?: string;
  aadharDocument?: { fileName: string };
  panDocument?: { fileName: string };
}
export interface EmployeeData {
  users?: Employee[];
  pagination?: { total: number };
  message?: string;
}
export { pageSize };
const defaultStatus: EmployeeStatusFilter =
  Platform.OS === 'web' ? 'active' : 'all';

export function useFranchiseEmployees() {
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [status, setStatus] = useState<EmployeeStatusFilter>(defaultStatus);
  const [draftStatus, setDraftStatus] =
    useState<EmployeeStatusFilter>(defaultStatus);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [hikeEmployee, setHikeEmployee] = useState<Employee | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Employee | null>(null);
  const [exitDate, setExitDate] = useState(() => businessDate());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);
  const [pendingToast, setPendingToast] = useState('');
  const [paidLeaveEnabled, setPaidLeaveEnabled] = useState(false);
  const [adjustingPaidLeaveId, setAdjustingPaidLeaveId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const query = new URLSearchParams({
        includeArchived: 'true',
        limit: '500',
      });
      const [response, paidLeaveResponse] = await Promise.all([
        apiRequest(`/users?${query.toString()}`),
        apiRequest('/stores/paid-leave'),
      ]);
      const [data, paidLeaveData] = await Promise.all([
        response.json().catch(() => ({})) as Promise<EmployeeData>,
        paidLeaveResponse.json().catch(() => ({})) as Promise<{ enabled?: boolean; message?: string }>,
      ]);
      if (!response.ok)
        throw new Error(data.message ?? t('franchiseEmployeesLoadFailed'));
      if (!paidLeaveResponse.ok)
        throw new Error(paidLeaveData.message ?? t('franchiseEmployeesLoadFailed'));
      setEmployees(data.users ?? []);
      setPaidLeaveEnabled(paidLeaveData.enabled === true);
      setVisibleCount(pageSize);
    } catch (failure) {
      setLoadError(
        failure instanceof Error
          ? failure.message
          : t('franchiseEmployeesLoadFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load, reloadKey]);
  // Search/status and visibleCount operate on the loaded roster, not server-side pagination.
  const filtered = useMemo(
    () =>
      employees.filter(employee => {
        const needle = search.trim().toLocaleLowerCase();
        const matchesSearch =
          !needle ||
          employee.name.toLocaleLowerCase().includes(needle) ||
          (employee.phone ?? '').toLocaleLowerCase().includes(needle) ||
          (employee.employeeCode ?? '').toLocaleLowerCase().includes(needle);
        const matchesStatus =
          status === 'all' ||
          (status === 'active'
            ? employee.isActive !== false
            : employee.isActive === false);
        return matchesSearch && matchesStatus;
      }),
    [employees, search, status],
  );
  const activeCount = employees.filter(
    employee => employee.isActive !== false,
  ).length;
  const archivedCount = employees.length - activeCount;
  const hasActiveFilters = Boolean(search.trim() || status !== defaultStatus);
  const summary = [
    {
      label: t('franchiseEmployeesAll'),
      value: String(employees.length),
      color: theme.colors.teal,
      Icon: UsersRound,
    },
    {
      label: t('franchiseEmployeesActive'),
      value: String(activeCount),
      color: theme.colors.orange,
      Icon: UserRound,
    },
    {
      label: t('franchiseEmployeesArchived'),
      value: String(archivedCount),
      color: theme.colors.yellow,
      Icon: Archive,
    },
  ];
  const openFilters = () => {
    setDraftSearch(search);
    setDraftStatus(status);
    setFilterVisible(true);
  };
  const applyFilters = () => {
    setSearch(draftSearch.trim());
    setStatus(draftStatus);
    setVisibleCount(pageSize);
    setFilterVisible(false);
  };
  const clearFilters = () => {
    setDraftSearch('');
    setDraftStatus(defaultStatus);
    setSearch('');
    setStatus(defaultStatus);
    setVisibleCount(pageSize);
    setFilterVisible(false);
  };
  const openCreate = () => {
    setEditing(null);
    setFormVisible(true);
  };
  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setFormVisible(true);
  };
  const saved = (message: string) => {
    setPendingToast(message);
    setFormVisible(false);
    setReloadKey(key => key + 1);
  };
  const archive = async () => {
    if (!archiveTarget) return;
    setBusy(true);
    try {
      // DELETE archives with an exit date so historical attendance and payroll remain available.
      const response = await apiRequest(
        `/users/${encodeURIComponent(
          archiveTarget._id,
        )}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exitDate }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok)
        throw new Error(data.message ?? t('franchiseEmployeesActionFailed'));
      setPendingToast(data.message ?? t('franchiseEmployeesArchivedSuccess'));
      setArchiveTarget(null);
      setReloadKey(key => key + 1);
    } catch (failure) {
      setToast({
        message:
          failure instanceof Error
            ? failure.message
            : t('franchiseEmployeesActionFailed'),
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  };
  const restore = async (employee: Employee) => {
    try {
      const response = await apiRequest(
        `/users/${encodeURIComponent(
          employee._id,
        )}`,
        { method: 'PUT' },
      );
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok)
        throw new Error(data.message ?? t('franchiseEmployeesActionFailed'));
      setToast({
        message: data.message ?? t('franchiseEmployeesRestoredSuccess'),
        tone: 'success',
      });
      setReloadKey(key => key + 1);
    } catch (failure) {
      setToast({
        message:
          failure instanceof Error
            ? failure.message
            : t('franchiseEmployeesActionFailed'),
        tone: 'error',
      });
    }
  };
  const adjustPaidLeave = async (
    employee: Employee,
    action: 'increment' | 'decrement',
  ) => {
    if (adjustingPaidLeaveId) return;
    setAdjustingPaidLeaveId(employee._id);
    try {
      const response = await apiRequest(
        `/users/${encodeURIComponent(employee._id)}/paid-leave`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, amount: 1 }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok)
        throw new Error(data.message ?? t('franchiseEmployeesActionFailed'));
      setToast({
        message: data.message ?? t('franchiseEmployeesPaidLeaveUpdated'),
        tone: 'success',
      });
      setReloadKey(key => key + 1);
    } catch (failure) {
      setToast({
        message:
          failure instanceof Error
            ? failure.message
            : t('franchiseEmployeesActionFailed'),
        tone: 'error',
      });
    } finally {
      setAdjustingPaidLeaveId(null);
    }
  };
  const afterFormClose = () => {
    if (pendingToast) {
      setToast({ message: pendingToast, tone: 'success' });
      setPendingToast('');
    }
    setEditing(null);
  };
  const afterArchiveClose = () => {
    if (pendingToast) {
      setToast({ message: pendingToast, tone: 'success' });
      setPendingToast('');
    }
    setArchiveTarget(null);
  };
  return {
    layout,
    employees,
    paidLeaveEnabled,
    adjustingPaidLeaveId,
    loading,
    loadError,
    setReloadKey,
    filterVisible,
    setFilterVisible,
    draftSearch,
    setDraftSearch,
    draftStatus,
    setDraftStatus,
    visibleCount,
    setVisibleCount,
    formVisible,
    setFormVisible,
    editing,
    hikeEmployee,
    setHikeEmployee,
    archiveTarget,
    setArchiveTarget,
    exitDate,
    setExitDate,
    busy,
    toast,
    setToast,
    filtered,
    hasActiveFilters,
    summary,
    openFilters,
    applyFilters,
    clearFilters,
    openCreate,
    openEdit,
    saved,
    archive,
    restore,
    adjustPaidLeave,
    afterFormClose,
    afterArchiveClose,
  };
}
