import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Filter, Plus } from '../../../icons';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppToast } from '../../../components/AppToast';
import { AppLoader } from '../../../components/AppLoader';
import { apiRequest } from '../../../api/auth';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { getAdminLayout } from '../../../utils/adminLayout';
import { ResponsiveDrawerModal } from '../../../components/ResponsiveDrawerModal';
import { StoreFiltersDrawer } from './StoreFiltersDrawer';
import { StoreFormDrawer } from './StoreFormDrawer';
import { StoreCard } from './StoreCard';
import { defaultStoreFilters, emptyForm } from './defaults';
import type { AdminStoresScreenProps, PageInfo, StoreForm, StoreListFilters, StoreRecord, StoreStatusFilter, StoreTypeFilter } from './types';

export function AdminStoresScreen({ userId, onToast }: AdminStoresScreenProps) {
  const { width, height } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StoreStatusFilter>('active');
  const [typeFilter, setTypeFilter] = useState<StoreTypeFilter>('all');
  const [openMobileFilter, setOpenMobileFilter] = useState<'status' | 'type' | null>(null);
  const [appliedFilters, setAppliedFilters] = useState(defaultStoreFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ page: 1, totalPages: 1, total: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);
  const [pendingArchive, setPendingArchive] = useState<StoreRecord | null>(null);
  const [pendingArchiveValue, setPendingArchiveValue] = useState(true);
  const [pendingArchiveToast, setPendingArchiveToast] = useState('');
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const [formIsArchived, setFormIsArchived] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<'error' | 'success'>('error');
  const [pendingSuccessMessage, setPendingSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof StoreForm, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [updatingArchiveId, setUpdatingArchiveId] = useState<string | null>(null);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const initialLoadComplete = useRef(false);
  const dismissToast = useCallback(() => setToastMessage(''), []);

  function showErrorToast(message: string): void {
    setToastTone('error');
    setToastMessage(message);
  }

  const loadStores = useCallback(async (page: number, filters: StoreListFilters, append = false): Promise<boolean> => {
    if (append) setIsLoadingMore(true);
    else setIsRefreshing(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '9',
        status: filters.status,
        type: filters.type,
      });
      if (filters.search.trim()) query.set('search', filters.search.trim());
      const response = await apiRequest(`/stores?${query.toString()}`);
      const data = await response.json() as { franchises?: StoreRecord[]; pagination?: PageInfo; message?: string };
      if (!response.ok) throw new Error(data.message ?? t('adminLoadFailed'));
      const loadedStores = data.franchises ?? [];
      setStores((current) => append ? [...current, ...loadedStores] : loadedStores);
      setPageInfo(data.pagination ?? { page, totalPages: page, total: loadedStores.length });
      initialLoadComplete.current = true;
      return true;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : t('adminLoadFailed');
      if (append || initialLoadComplete.current) onToast(message, 'error');
      else setError(message);
      return false;
    } finally {
      if (append) setIsLoadingMore(false);
      else {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [onToast]);

  useEffect(() => {
    void loadStores(1, defaultStoreFilters);
  }, [loadStores]);

  const visibleStores = stores;
  const hasActiveFilters = Boolean(
    appliedFilters.search
    || appliedFilters.status !== 'active'
    || appliedFilters.type !== 'all',
  );
  const hasDraftFilters = Boolean(searchText.trim() || statusFilter !== 'active' || typeFilter !== 'all');

  function openFilters(): void {
    setSearchText(appliedFilters.search);
    setStatusFilter(appliedFilters.status);
    setTypeFilter(appliedFilters.type);
    setOpenMobileFilter(null);
    setIsFilterDrawerOpen(true);
  }

  async function applyFilters(): Promise<void> {
    const filters: StoreListFilters = {
      search: searchText.trim(),
      status: statusFilter,
      type: typeFilter,
    };
    setOpenMobileFilter(null);
    setIsFilterDrawerOpen(false);
    if (!await loadStores(1, filters)) return;
    setAppliedFilters(filters);
  }

  async function clearFilters(): Promise<void> {
    setOpenMobileFilter(null);
    setIsFilterDrawerOpen(false);
    if (!await loadStores(1, defaultStoreFilters)) return;
    setSearchText('');
    setStatusFilter('active');
    setTypeFilter('all');
    setAppliedFilters(defaultStoreFilters);
  }

  function loadMore(): void {
    void loadStores(pageInfo.page + 1, appliedFilters, true);
  }

  function openCreate(): void {
    setEditingStore(null);
    setForm(emptyForm);
    setFormIsArchived(false);
    setToastMessage('');
    setFieldErrors({});
    setIsFormOpen(true);
  }

  function openEdit(store: StoreRecord): void {
    setEditingStore(store);
    setFormIsArchived(Boolean(store.archivedAt) || store.isActive === false);
    setForm({
      name: store.name,
      storeCode: store.storeCode,
      address: store.address ?? '',
      phone: store.phone ?? '',
      description: store.description ?? '',
      storeType: store.storeType,
      ownerName: store.ownerName ?? '',
      ownerPhone: store.ownerPhone ?? '',
      ownerEmail: store.ownerEmail ?? '',
    });
    setToastMessage('');
    setFieldErrors({});
    setIsFormOpen(true);
  }

  function updateField<Key extends keyof StoreForm>(key: Key, value: StoreForm[Key]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setToastMessage('');
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validate(): Partial<Record<keyof StoreForm, string>> {
    const errors: Partial<Record<keyof StoreForm, string>> = {};
    if (!form.name.trim()) errors.name = t('adminStoreNameRequired');
    if (!form.storeCode.trim()) errors.storeCode = t('adminStoreCodeRequired');
    if (form.phone && !/^\d{10}$/.test(form.phone)) errors.phone = t('adminPhoneInvalid');
    if (form.storeType === 'franchise' && form.ownerPhone && !/^\d{10}$/.test(form.ownerPhone)) {
      errors.ownerPhone = t('adminOwnerPhoneInvalid');
    }
    if (form.storeType === 'franchise' && form.ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) {
      errors.ownerEmail = t('adminOwnerEmailInvalid');
    }
    return errors;
  }

  async function saveStore(confirmedStatusChange = false): Promise<void> {
    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setToastMessage('');
      return;
    }
    const statusChanged = editingStore !== null
      && formIsArchived !== (Boolean(editingStore.archivedAt) || editingStore.isActive === false);
    if (statusChanged && !confirmedStatusChange && editingStore) {
      setPendingArchive(editingStore);
      setPendingArchiveValue(formIsArchived);
      setIsArchiveDialogOpen(true);
      return;
    }
    setIsSaving(true);
    setToastMessage('');
    try {
      const response = await apiRequest(
        editingStore ? `/stores?id=${encodeURIComponent(editingStore._id)}` : '/stores',
        {
          method: editingStore ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            storeCode: form.storeCode.trim().toUpperCase(),
            ownerName: form.storeType === 'franchise' ? form.ownerName : '',
            ownerPhone: form.storeType === 'franchise' ? form.ownerPhone : '',
            ownerEmail: form.storeType === 'franchise' ? form.ownerEmail : '',
          }),
        },
      );
      const data = await response.json() as { message?: string };
      if (!response.ok) {
        showErrorToast(data.message ?? t('adminSaveFailed'));
        return;
      }
      if (statusChanged && editingStore) {
        const archiveResponse = await apiRequest(`/stores/archive?id=${encodeURIComponent(editingStore._id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: formIsArchived }),
        });
        const archiveData = await archiveResponse.json() as { message?: string };
        if (!archiveResponse.ok) {
          showErrorToast(archiveData.message ?? t('adminSaveFailed'));
          return;
        }
      }
      const successMessage = t(editingStore ? 'adminStoreUpdated' : 'adminStoreCreated');
      setPendingSuccessMessage(successMessage);
      setIsFormOpen(false);
      setEditingStore(null);
      setForm(emptyForm);
      setFormIsArchived(false);
      setFieldErrors({});
      onToast(successMessage, 'success');
      await loadStores(1, appliedFilters);
    } catch {
      showErrorToast(t('adminNetworkError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStoreArchive(store: StoreRecord, archived: boolean): Promise<void> {
    setUpdatingArchiveId(store._id);
    try {
      const response = await apiRequest(`/stores/archive?id=${encodeURIComponent(store._id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived }),
      });
      const data = await response.json() as { message?: string };
      if (!response.ok) {
        showErrorToast(data.message ?? t('adminSaveFailed'));
        return;
      }
      setPendingArchiveToast(data.message ?? t(archived ? 'adminStoreArchived' : 'adminStoreRestored'));
      setIsArchiveDialogOpen(false);
      await loadStores(1, appliedFilters);
    } catch {
      showErrorToast(t('adminNetworkError'));
    } finally {
      setUpdatingArchiveId(null);
    }
  }

  if (isLoading) return <AppLoader variant="screen" />;
  if (error) return <AppErrorState message={error} onRetry={() => void loadStores(1, appliedFilters)} />;

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          {layout.desktopWeb ? <Text style={[styles.screenEyebrow, styles.screenEyebrowTeal]}>Workspace setup</Text> : null}
          <View style={styles.screenTitleRow}>
            <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('adminStores')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('adminOpenFilters')}
              onPress={openFilters}
              style={styles.filterIconButton}
            >
              <Filter color={theme.colors.teal} size={18} />
              {hasActiveFilters ? <View style={styles.filterActiveDot} /> : null}
            </Pressable>
          </View>
          <Text style={styles.screenDescription}>{t('adminStoreCount', { count: pageInfo.total })}</Text>
        </View>
        <View style={styles.screenHeaderActions}>
          {layout.desktopWeb ? (
            <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, styles.screenHeaderAction]}>
              <Text style={styles.primaryButtonText}>{t('adminAddStore')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isRefreshing ? <AppLoader variant="inline" /> : null}

      {visibleStores.length === 0 ? <Text style={styles.stateMessage}>{hasActiveFilters ? t('adminNoMatchingStores') : t('adminNoStores')}</Text> : null}

      <ScrollView
        style={[styles.list, !layout.desktopWeb && styles.storeListFabViewport]}
        contentContainerStyle={[
          styles.listContent,
          !layout.desktopWeb && styles.storeListWithFab,
          layout.isWeb && styles.storeGrid,
        ]}
      >
        {visibleStores.map((store) => (
          <StoreCard
            key={store._id}
            store={store}
            userId={userId}
            storeCardStyle={layout.storeCardStyle}
            actionsAtBottom={layout.storeCardActionsAtBottom}
            isUpdatingArchive={updatingArchiveId === store._id}
            onEdit={openEdit}
            onArchive={(target) => {
              setPendingArchive(target);
              setPendingArchiveValue(!target.archivedAt);
              setIsArchiveDialogOpen(true);
            }}
          />
        ))}
        {pageInfo.page < pageInfo.totalPages ? (
          <View style={styles.loadMoreFooter}>
            <Pressable
              accessibilityRole="button"
              disabled={isLoadingMore}
              onPress={loadMore}
              style={[styles.loadMoreButton, isLoadingMore && styles.loadMoreButtonDisabled]}
            >
              {isLoadingMore
                ? <AppLoader variant="inline" />
                : <Text style={styles.loadMoreButtonText}>{t('adminLoadMore')}</Text>}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {!layout.desktopWeb ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('adminAddStore')} onPress={openCreate} style={styles.fab}>
          <Plus color={theme.colors.white} size={24} />
        </Pressable>
      ) : null}

      <StoreFiltersDrawer
        visible={isFilterDrawerOpen}
        height={height}
        isWeb={layout.isWeb}
        searchText={searchText}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        openFilter={openMobileFilter}
        hasDraftFilters={hasDraftFilters}
        onClose={() => setIsFilterDrawerOpen(false)}
        onAfterClose={() => setOpenMobileFilter(null)}
        onSearchChange={setSearchText}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setOpenMobileFilter(null);
        }}
        onTypeChange={(value) => {
          setTypeFilter(value);
          setOpenMobileFilter(null);
        }}
        onToggleFilter={(filter) => setOpenMobileFilter((current) => current === filter ? null : filter)}
        onDismissDropdown={() => setOpenMobileFilter(null)}
        onClearFilters={clearFilters}
        onApplyFilters={applyFilters}
      />

      <StoreFormDrawer
        visible={isFormOpen}
        editingStore={editingStore}
        form={form}
        formIsArchived={formIsArchived}
        fieldErrors={fieldErrors}
        isSaving={isSaving}
        toastMessage={toastMessage}
        toastTone={toastTone}
        onClose={() => setIsFormOpen(false)}
        onAfterClose={() => {
          if (!pendingSuccessMessage) return;
          onToast(pendingSuccessMessage, 'success');
          setPendingSuccessMessage('');
        }}
        onDismissToast={dismissToast}
        onFieldChange={updateField}
        onArchivedChange={setFormIsArchived}
        onSave={() => void saveStore()}
      />

      {!isFormOpen && toastMessage ? <AppToast message={toastMessage} tone={toastTone} onDismiss={dismissToast} /> : null}

      <ResponsiveDrawerModal
        visible={isArchiveDialogOpen && pendingArchive !== null}
        presentation="dialog"
        closeLabel={t('adminCloseMenu')}
        onClose={() => setIsArchiveDialogOpen(false)}
        onAfterClose={() => {
          setPendingArchive(null);
          if (!pendingArchiveToast) return;
          onToast(pendingArchiveToast, 'success');
          setPendingArchiveToast('');
        }}
      >
        <View style={styles.confirmDialogContent}>
          <View style={styles.confirmDialogHeader}>
            <Text style={[styles.modalTitle, styles.confirmDialogTitle]}>{t(pendingArchiveValue ? 'adminArchiveStore' : 'adminRestoreStore')}</Text>
          </View>
          <View style={styles.confirmDialogBody}>
            <Text style={styles.screenDescription}>
              {t(pendingArchiveValue ? 'adminConfirmArchiveStore' : 'adminConfirmRestoreStore', { name: pendingArchive?.name ?? '' })}
            </Text>
          </View>
          <View style={styles.confirmDialogActions}>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable onPress={() => setIsArchiveDialogOpen(false)} style={[styles.secondaryButton, styles.confirmDialogActionButton]}>
                <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
              </Pressable>
            </View>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable disabled={updatingArchiveId === pendingArchive?._id || isSaving} onPress={() => {
                if (!pendingArchive) return;
                if (isFormOpen) {
                  setIsArchiveDialogOpen(false);
                  void saveStore(true);
                  return;
                }
                void updateStoreArchive(pendingArchive, pendingArchiveValue);
              }} style={[styles.primaryButton, styles.confirmDialogActionButton]}>
                {updatingArchiveId === pendingArchive?._id ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t(pendingArchiveValue ? 'adminArchive' : 'adminRestore')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>
    </View>
  );
}
