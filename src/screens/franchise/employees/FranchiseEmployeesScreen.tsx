import { Pressable, ScrollView, Text, View } from 'react-native';
import { AdminFormField } from '../../../components/AdminFormField';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { SummaryCards } from '../../../components/SummaryCards';
import { theme } from '../../../config/theme';
import { getLocale, t } from '../../../i18n';
import { Archive, Filter, Pencil, Plus, RotateCcw, X } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { EmployeeFiltersDrawer } from './EmployeeFiltersDrawer';
import { EmployeeFormDrawer } from './EmployeeFormDrawer';
import { employeeStyles } from './employeeStyles';
import { pageSize, useFranchiseEmployees } from './useFranchiseEmployees';
import { businessDate } from '../../../utils/businessDate';


export function FranchiseEmployeesScreen({ storeId }: { storeId: string; }) {
  const {
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
  } = useFranchiseEmployees({ storeId });
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
                  <View style={employeeStyles.identityCopy}><Text style={styles.userCardName}>{employee.name}{employee.employeeCode ? ` (${employee.employeeCode})` : ''}</Text><Text style={styles.rowSubtext}>{employee.position || '—'}</Text></View>
                </View>
                <View style={styles.storeCardHeaderActions}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t('franchiseEmployeesEdit')} ${employee.name}`} onPress={() => openEdit(employee)} style={styles.userIconAction}><Pencil color={theme.colors.teal} size={16} /></Pressable>
                  {employee.isActive === false
                    ? <Pressable accessibilityRole="button" accessibilityLabel={`${t('franchiseEmployeesRestore')} ${employee.name}`} onPress={() => restore(employee)} style={styles.userIconAction}><RotateCcw color={theme.colors.teal} size={16} /></Pressable>
                    : <Pressable accessibilityRole="button" accessibilityLabel={`${t('franchiseEmployeesArchive')} ${employee.name}`} onPress={() => { setExitDate(businessDate()); setArchiveTarget(employee); }} style={styles.userIconAction}><Archive color={theme.colors.orange} size={16} /></Pressable>}
                </View>
              </View>
              <View style={styles.storeCardBody}>
                {employee.phone ? <Text style={employeeStyles.detail}>{employee.phone}</Text> : null}
                <View style={employeeStyles.metrics}><Text style={employeeStyles.detail}>{t('franchiseEmployeesSalaryLabel')}: {employee.salary == null ? '—' : `₹${employee.salary.toLocaleString(getLocale())}`}</Text><Text style={employeeStyles.detail}>{t('franchiseEmployeesJoinedLabel')}: {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString(getLocale()) : '—'}</Text></View>
                <View style={[employeeStyles.badge, employee.isActive === false ? employeeStyles.inactiveBadge : employeeStyles.activeBadge]}><Text style={employeeStyles.badgeText}>{t(employee.isActive === false ? 'franchiseEmployeesArchived' : 'franchiseEmployeesActive')}</Text></View>
                {employee.isActive === false && employee.archivedAt ? <Text style={employeeStyles.detail}>{t('franchiseEmployeesExitDateLabel')}: {new Date(employee.archivedAt).toLocaleDateString(getLocale())}</Text> : null}
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
          <AdminFormField date label={t('franchiseEmployeesExitDate')} value={exitDate} onChangeText={setExitDate} placeholder="YYYY-MM-DD" />
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
