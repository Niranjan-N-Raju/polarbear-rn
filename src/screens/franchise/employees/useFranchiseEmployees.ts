import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Archive, UserRound, UsersRound } from '../../../icons';
import { getAdminLayout } from '../../../utils/adminLayout';
import { localDateValue } from '../dashboardDates';
import { type EmployeeStatusFilter } from './EmployeeFiltersDrawer';
export interface Employee {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  employmentType?: 'full_time' | 'part_time';
  salary?: number;
  dateOfJoining?: string;
  isActive?: boolean;
  archivedAt?: string;
  aadharDocument?: { fileName: string; };
  panDocument?: { fileName: string; };
}
export interface EmployeeData { users?: Employee[]; pagination?: { total: number; }; message?: string; }
export const pageSize = 9;

export function useFranchiseEmployees({ storeId }: { storeId: string; }) {
  const { width } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [status, setStatus] = useState<EmployeeStatusFilter>('all');
  const [draftStatus, setDraftStatus] = useState<EmployeeStatusFilter>('all');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Employee | null>(null);
  const [exitDate, setExitDate] = useState(localDateValue());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error'; } | null>(null);
  const [pendingToast, setPendingToast] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const query = new URLSearchParams({ storeId, includeArchived: 'true', limit: '500' });
      const response = await apiRequest(`/users?${query.toString()}`);
      const data = await response.json().catch(() => ({})) as EmployeeData;
      if (!response.ok) throw new Error(data.message ?? t('franchiseEmployeesLoadFailed'));
      setEmployees(data.users ?? []);
      setVisibleCount(pageSize);
    } catch (failure) {
      setLoadError(failure instanceof Error ? failure.message : t('franchiseEmployeesLoadFailed'));
    } finally { setLoading(false); }
  }, [storeId]);
  useEffect(() => { load(); }, [load, reloadKey]);
  // Search/status and visibleCount operate on the loaded roster, not server-side pagination.
  const filtered = useMemo(() => employees.filter((employee) => {
    const needle = search.trim().toLocaleLowerCase();
    const matchesSearch = !needle || employee.name.toLocaleLowerCase().includes(needle) || (employee.phone ?? '').toLocaleLowerCase().includes(needle);
    const matchesStatus = status === 'all' || (status === 'active' ? employee.isActive !== false : employee.isActive === false);
    return matchesSearch && matchesStatus;
  }), [employees, search, status]);
  const activeCount = employees.filter((employee) => employee.isActive !== false).length;
  const archivedCount = employees.length - activeCount;
  const hasActiveFilters = Boolean(search.trim() || status !== 'all');
  const summary = [
    { label: t('franchiseEmployeesAll'), value: String(employees.length), color: theme.colors.teal, Icon: UsersRound },
    { label: t('franchiseEmployeesActive'), value: String(activeCount), color: theme.colors.orange, Icon: UserRound },
    { label: t('franchiseEmployeesArchived'), value: String(archivedCount), color: theme.colors.yellow, Icon: Archive },
  ];
  const openFilters = () => { setDraftSearch(search); setDraftStatus(status); setFilterVisible(true); };
  const applyFilters = () => { setSearch(draftSearch.trim()); setStatus(draftStatus); setVisibleCount(pageSize); setFilterVisible(false); };
  const clearFilters = () => { setDraftSearch(''); setDraftStatus('all'); setSearch(''); setStatus('all'); setVisibleCount(pageSize); setFilterVisible(false); };
  const openCreate = () => { setEditing(null); setFormVisible(true); };
  const openEdit = (employee: Employee) => { setEditing(employee); setFormVisible(true); };
  const saved = (message: string) => { setPendingToast(message); setFormVisible(false); setReloadKey((key) => key + 1); };
  const archive = async () => {
    if (!archiveTarget) return;
    setBusy(true);
    try {
      // DELETE archives with an exit date so historical attendance and payroll remain available.
      const response = await apiRequest(`/users/${encodeURIComponent(archiveTarget._id)}?storeId=${encodeURIComponent(storeId)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exitDate }) });
      const data = await response.json().catch(() => ({})) as { message?: string; };
      if (!response.ok) throw new Error(data.message ?? t('franchiseEmployeesActionFailed'));
      setPendingToast(data.message ?? t('franchiseEmployeesArchivedSuccess'));
      setArchiveTarget(null);
      setReloadKey((key) => key + 1);
    } catch (failure) { setToast({ message: failure instanceof Error ? failure.message : t('franchiseEmployeesActionFailed'), tone: 'error' }); }
    finally { setBusy(false); }
  };
  const restore = async (employee: Employee) => {
    try {
      const response = await apiRequest(`/users/${encodeURIComponent(employee._id)}?storeId=${encodeURIComponent(storeId)}`, { method: 'PUT' });
      const data = await response.json().catch(() => ({})) as { message?: string; };
      if (!response.ok) throw new Error(data.message ?? t('franchiseEmployeesActionFailed'));
      setToast({ message: data.message ?? t('franchiseEmployeesRestoredSuccess'), tone: 'success' });
      setReloadKey((key) => key + 1);
    } catch (failure) { setToast({ message: failure instanceof Error ? failure.message : t('franchiseEmployeesActionFailed'), tone: 'error' }); }
  };
  const afterFormClose = () => {
    if (pendingToast) { setToast({ message: pendingToast, tone: 'success' }); setPendingToast(''); }
    setEditing(null);
  };
  const afterArchiveClose = () => {
    if (pendingToast) { setToast({ message: pendingToast, tone: 'success' }); setPendingToast(''); }
    setArchiveTarget(null);
  };
  return {
    layout,
    employees,
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
    afterFormClose,
    afterArchiveClose,
  };
}
