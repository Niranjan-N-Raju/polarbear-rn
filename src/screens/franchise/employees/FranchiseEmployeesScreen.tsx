import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Archive, Filter, Pencil, Plus, RotateCcw, UserRound, UsersRound, X } from '../../../icons';
import { apiRequest } from '../../../api/auth';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { getAdminLayout } from '../../../utils/adminLayout';
import { localDateValue } from '../dashboardDates';
import { SummaryCards } from '../../../components/SummaryCards';
import { EmployeeFiltersDrawer, type EmployeeStatusFilter } from './EmployeeFiltersDrawer';
import { EmployeeFormDrawer } from './EmployeeFormDrawer';
import { employeeStyles } from './employeeStyles';

interface Employee {
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
  aadharDocument?: { fileName: string };
  panDocument?: { fileName: string };
}
interface EmployeeData { users?: Employee[]; pagination?: { total: number }; message?: string }
const pageSize = 9;

export function FranchiseEmployeesScreen({ storeId }: { storeId: string }) {
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
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
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
      const response = await apiRequest(`/users/${encodeURIComponent(archiveTarget._id)}?storeId=${encodeURIComponent(storeId)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exitDate }) });
      const data = await response.json().catch(() => ({})) as { message?: string };
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
      const data = await response.json().catch(() => ({})) as { message?: string };
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

  if (loading && employees.length === 0) return <View style={styles.screen}><AppLoader /></View>;
  if (loadError && employees.length === 0) return <View style={styles.screen}><AppErrorState message={loadError} onRetry={() => setReloadKey((key) => key + 1)} /></View>;

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          <View style={styles.screenTitleRow}>
            <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('franchiseEmployeesTitle')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseEmployeesFilter')} onPress={openFilters} style={styles.filterIconButton}>
              <Filter color={theme.colors.teal} size={18} />{hasActiveFilters ? <View style={styles.filterActiveDot} /> : null}
            </Pressable>
          </View>
          <Text style={styles.screenDescription}>{t('franchiseEmployeesDescription', { count: filtered.length })}</Text>
        </View>
        {layout.desktopWeb ? <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, styles.screenHeaderAction]}><Text style={styles.primaryButtonText}>{t('franchiseEmployeesAdd')}</Text></Pressable> : null}
      </View>
      {loading ? <AppLoader variant="inline" /> : null}
      {loadError ? <Text accessibilityRole="alert" style={employeeStyles.error}>{loadError}</Text> : null}
      <ScrollView style={[styles.list, !layout.desktopWeb && styles.storeListFabViewport]} contentContainerStyle={[styles.listContent, !layout.desktopWeb && styles.storeListWithFab]}>
        <SummaryCards cards={summary} isWeb={layout.isWeb} perRow={layout.desktopWeb ? 3 : 2} />
        {filtered.length === 0 ? <Text style={styles.stateMessage}>{employees.length === 0 ? t('franchiseEmployeesNoEmployees') : t('franchiseEmployeesNoMatches')}</Text> : null}
        <View style={layout.isWeb ? styles.storeGrid : undefined}>
          {filtered.slice(0, visibleCount).map((employee) => (
            <View key={employee._id} style={[styles.storeCard, employeeStyles.employeeCard, layout.storeCardStyle ? styles[layout.storeCardStyle] : undefined]}>
              <View style={styles.storeCardHeader}>
                <View style={employeeStyles.identity}>
                  <View style={employeeStyles.avatar}><Text style={employeeStyles.avatarText}>{employee.name.charAt(0).toUpperCase()}</Text></View>
                  <View style={employeeStyles.identityCopy}><Text numberOfLines={1} style={styles.userCardName}>{employee.name}</Text><Text style={styles.rowSubtext}>{employee.position || '—'}</Text></View>
                </View>
                <View style={styles.storeCardHeaderActions}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t('franchiseEmployeesEdit')} ${employee.name}`} onPress={() => openEdit(employee)} style={styles.userIconAction}><Pencil color={theme.colors.teal} size={16} /></Pressable>
                  {employee.isActive === false
                    ? <Pressable accessibilityRole="button" accessibilityLabel={`${t('franchiseEmployeesRestore')} ${employee.name}`} onPress={() => restore(employee)} style={styles.userIconAction}><RotateCcw color={theme.colors.teal} size={16} /></Pressable>
                    : <Pressable accessibilityRole="button" accessibilityLabel={`${t('franchiseEmployeesArchive')} ${employee.name}`} onPress={() => { setExitDate(new Date().toISOString().slice(0, 10)); setArchiveTarget(employee); }} style={styles.userIconAction}><Archive color={theme.colors.orange} size={16} /></Pressable>}
                </View>
              </View>
              <View style={styles.storeCardBody}>
                {employee.phone ? <Text style={employeeStyles.detail}>{employee.phone}</Text> : null}
                <View style={employeeStyles.metrics}><Text style={employeeStyles.detail}>{t('franchiseEmployeesSalaryLabel')}: {employee.salary === undefined ? '—' : `₹${employee.salary.toLocaleString('en-IN')}`}</Text><Text style={employeeStyles.detail}>{t('franchiseEmployeesJoinedLabel')}: {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '—'}</Text></View>
                <View style={[employeeStyles.badge, employee.isActive === false ? employeeStyles.inactiveBadge : employeeStyles.activeBadge]}><Text style={employeeStyles.badgeText}>{t(employee.isActive === false ? 'franchiseEmployeesArchived' : 'franchiseEmployeesActive')}</Text></View>
                {employee.isActive === false && employee.archivedAt ? <Text style={employeeStyles.detail}>{t('franchiseEmployeesExitDateLabel')}: {new Date(employee.archivedAt).toLocaleDateString()}</Text> : null}
              </View>
            </View>
          ))}
        </View>
        {filtered.length > visibleCount ? <Pressable accessibilityRole="button" onPress={() => setVisibleCount((count) => count + pageSize)} style={[styles.loadMoreButton, employeeStyles.loadMore]}><Text style={styles.loadMoreButtonText}>{t('franchiseEmployeesLoadMore')}</Text></Pressable> : null}
      </ScrollView>
      {!layout.desktopWeb ? <Pressable accessibilityRole="button" accessibilityLabel={t('franchiseEmployeesAdd')} onPress={openCreate} style={styles.fab}><Plus color={theme.colors.white} size={24} /></Pressable> : null}

      <EmployeeFiltersDrawer visible={filterVisible} search={draftSearch} status={draftStatus} onClose={() => setFilterVisible(false)} onSearchChange={setDraftSearch} onStatusChange={setDraftStatus} onClear={clearFilters} onApply={applyFilters} />
      <EmployeeFormDrawer visible={formVisible} storeId={storeId} employee={editing} onClose={() => setFormVisible(false)} onAfterClose={afterFormClose} onSaved={saved} />
      <ResponsiveDrawerModal visible={archiveTarget !== null} closeLabel={t('adminCloseMenu')} onClose={() => setArchiveTarget(null)} onAfterClose={afterArchiveClose}>
        <View style={styles.drawerContent}>
          <View style={styles.drawerHeading}><Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('franchiseEmployeesArchiveTitle')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={() => setArchiveTarget(null)} style={styles.userIconAction}><X color={theme.colors.muted} size={18} /></Pressable></View>
          <Text style={styles.screenDescription}>{t('franchiseEmployeesArchiveConfirm')}</Text>
          <AdminFormField label={t('franchiseEmployeesExitDate')} value={exitDate} onChangeText={setExitDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
          <View style={styles.modalActions}>
            <View style={styles.drawerActionSlot}><Pressable onPress={() => setArchiveTarget(null)} style={[styles.secondaryButton, styles.drawerActionButton]}><Text style={styles.secondaryButtonText}>{t('franchiseEmployeesCancel')}</Text></Pressable></View>
            <View style={styles.drawerActionSlot}><Pressable accessibilityRole="button" disabled={busy} onPress={() => archive()} style={[styles.primaryButton, styles.drawerActionButton]}><Text style={styles.primaryButtonText}>{t('franchiseEmployeesConfirmArchive')}</Text></Pressable></View>
          </View>
        </View>
      </ResponsiveDrawerModal>
      {toast ? <AppToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} /> : null}
    </View>
  );
}
