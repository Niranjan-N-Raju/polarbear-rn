import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { pageSize } from '../../../config/pagination';
import { t } from '../../../i18n';
import { getAdminLayout } from '../../../utils/adminLayout';
import { defaultStoreFilters, emptyForm } from './defaults';
import type { AdminStoresScreenProps, PageInfo, StoreForm, StoreListFilters, StoreRecord, StoreStatusFilter, StoreTypeFilter } from './types';


export function useAdminStores({ onToast }: AdminStoresScreenProps) {
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
  // Only the latest list request may publish results; unmount aborts the request in flight.
  const listControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      listControllerRef.current?.abort();
    };
  }, []);
  const loadStores = useCallback(async (page: number, filters: StoreListFilters, append = false): Promise<boolean> => {
    listControllerRef.current?.abort();
    const controller = new AbortController();
    listControllerRef.current = controller;
    const isCurrent = () => listControllerRef.current === controller && !controller.signal.aborted;
    if (append) setIsLoadingMore(true);
    else setIsRefreshing(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        status: filters.status,
        type: filters.type,
      });
      if (filters.search.trim()) query.set('search', filters.search.trim());
      const response = await apiRequest(`/stores?${query.toString()}`, { signal: controller.signal });
      const data = await response.json().catch(() => ({})) as { franchises?: StoreRecord[]; pagination?: PageInfo; message?: string; };
      if (!isCurrent()) return false;
      if (!response.ok) throw new Error(data.message ?? t('adminLoadFailed'));
      const loadedStores = data.franchises ?? [];
      setStores((current) => append ? [...current, ...loadedStores] : loadedStores);
      setPageInfo(data.pagination ?? { page, totalPages: page, total: loadedStores.length });
      initialLoadComplete.current = true;
      return true;
    } catch (loadError) {
      if (!isCurrent()) return false;
      const message = loadError instanceof Error ? loadError.message : t('adminLoadFailed');
      // Keep an already-loaded list usable; only the initial failure replaces it with an error state.
      if (append || initialLoadComplete.current) onToast(message, 'error');
      else setError(message);
      return false;
    } finally {
      if (isMountedRef.current) {
        if (append) setIsLoadingMore(false);
        else if (listControllerRef.current === controller) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
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
    // Commit filters only after their first page succeeds, keeping pagination tied to the displayed list.
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
      const data = await response.json().catch(() => ({})) as { message?: string; };
      if (!response.ok) {
        showErrorToast(data.message ?? t('adminSaveFailed'));
        return;
      }
      if (statusChanged && editingStore) {
        // Archiving is a separate API operation; a details update alone does not change store access.
        const archiveResponse = await apiRequest(`/stores/archive?id=${encodeURIComponent(editingStore._id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: formIsArchived }),
        });
        const archiveData = await archiveResponse.json().catch(() => ({})) as { message?: string; };
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
      const data = await response.json().catch(() => ({})) as { message?: string; };
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
  return {
    height,
    layout,
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    openMobileFilter,
    setOpenMobileFilter,
    appliedFilters,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    pageInfo,
    isRefreshing,
    isLoadingMore,
    isLoading,
    error,
    isFormOpen,
    setIsFormOpen,
    editingStore,
    pendingArchive,
    setPendingArchive,
    pendingArchiveValue,
    setPendingArchiveValue,
    pendingArchiveToast,
    setPendingArchiveToast,
    form,
    formIsArchived,
    setFormIsArchived,
    toastMessage,
    toastTone,
    pendingSuccessMessage,
    setPendingSuccessMessage,
    fieldErrors,
    isSaving,
    updatingArchiveId,
    isArchiveDialogOpen,
    setIsArchiveDialogOpen,
    dismissToast,
    loadStores,
    visibleStores,
    hasActiveFilters,
    hasDraftFilters,
    openFilters,
    applyFilters,
    clearFilters,
    loadMore,
    openCreate,
    openEdit,
    updateField,
    saveStore,
    updateStoreArchive,
  };
}
