import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Archive, ChevronDown, Filter, MapPin, Pencil, Phone, Plus, RotateCcw, Store as StoreIcon, X } from 'lucide-react-native';
import { AppErrorState } from '../../components/AppErrorState';
import { AppToast } from '../../components/AppToast';
import { AppLoader } from '../../components/AppLoader';
import { apiRequest } from '../../api/auth';
import { theme } from '../../config/theme';
import { t } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import { getAdminLayout } from '../../utils/adminLayout';
import { ResponsiveDrawerModal } from '../../components/ResponsiveDrawerModal';

interface StoreRecord {
  _id: string;
  name: string;
  storeCode: string;
  storeType: 'company' | 'franchise';
  address?: string;
  phone?: string;
  description?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  createdBy?: string;
  isActive?: boolean;
  archivedAt?: string | null;
}

interface StoreForm {
  name: string;
  storeCode: string;
  address: string;
  phone: string;
  description: string;
  storeType: 'company' | 'franchise';
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
}

type StoreStatusFilter = 'active' | 'archived' | 'all';
type StoreTypeFilter = 'all' | 'company' | 'franchise';
type StoreFilterValue = StoreStatusFilter | StoreTypeFilter;
interface StoreListFilters {
  search: string;
  status: StoreStatusFilter;
  type: StoreTypeFilter;
}
interface PageInfo {
  page: number;
  totalPages: number;
  total: number;
}

const emptyForm: StoreForm = {
  name: '', storeCode: '', address: '', phone: '', description: '',
  storeType: 'company', ownerName: '', ownerPhone: '', ownerEmail: '',
};
const defaultStoreFilters: StoreListFilters = { search: '', status: 'active', type: 'all' };

interface AdminStoresScreenProps {
  userId: string;
  onToast: (message: string, tone: 'success' | 'error') => void;
}

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
        limit: '10',
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
        {visibleStores.map((store) => {
          const canManage = store.createdBy === userId;
          return (
            <View
              key={store._id}
              style={[
                styles.storeCard,
                layout.storeCardStyle && styles[layout.storeCardStyle],
              ]}
            >
              <View style={styles.storeCardHeader}>
                <View style={styles.storeIconTile}><StoreIcon color={theme.colors.orange} size={20} /></View>
                <View style={styles.storeCardBody}>
                  <View style={styles.storeTitleRow}>
                    <Text numberOfLines={1} style={styles.storeTitle}>{store.name}</Text>
                    {store.storeCode ? <View style={styles.storeCodeBadge}><Text style={styles.storeCodeText}>{store.storeCode}</Text></View> : null}
                  </View>
                  <View style={styles.storeBadgeRow}>
                    <View style={[styles.storeTypeBadge, store.storeType === 'company' ? styles.storeCompanyBadge : styles.storeFranchiseBadge]}>
                      <Text style={[styles.storeTypeBadgeText, store.storeType === 'company' ? styles.storeCompanyBadgeText : styles.storeFranchiseBadgeText]}>
                        {store.storeType === 'company' ? t('adminCompanyStore') : t('adminFranchiseStore')}
                      </Text>
                    </View>
                    <View style={[styles.storeStatusBadge, store.isActive && !store.archivedAt ? styles.storeActiveBadge : styles.storeInactiveBadge]}>
                      <Text style={store.isActive && !store.archivedAt ? styles.storeActiveBadgeText : styles.storeInactiveBadgeText}>
                        {store.archivedAt ? t('adminArchived') : store.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>
                {canManage && !layout.storeCardActionsAtBottom ? (
                  <View style={styles.storeCardHeaderActions}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`${t('adminEditStore')} ${store.name}`} onPress={() => openEdit(store)} style={styles.storeCardHeaderAction}>
                      <Pencil color={theme.colors.teal} size={16} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${store.archivedAt ? t('adminRestore') : t('adminArchive')} ${store.name}`}
                      disabled={updatingArchiveId === store._id}
                      onPress={() => {
                        setPendingArchive(store);
                        setPendingArchiveValue(!store.archivedAt);
                        setIsArchiveDialogOpen(true);
                      }}
                      style={styles.storeCardHeaderAction}
                    >
                      {store.archivedAt
                        ? <RotateCcw color={theme.colors.orange} size={16} />
                        : <Archive color={theme.colors.orange} size={16} />}
                    </Pressable>
                  </View>
                ) : null}
              </View>
              {store.description ? <Text style={styles.storeDescription}>{store.description}</Text> : null}
              {store.address || store.phone ? (
                <View style={styles.storeContactBlock}>
                  {store.address ? <View style={styles.storeContactRow}><MapPin color="#9CA3AF" size={14} /><Text style={styles.storeContactText}>{store.address}</Text></View> : null}
                  {store.phone ? <View style={styles.storeContactRow}><Phone color="#9CA3AF" size={14} /><Text style={styles.storeContactText}>{store.phone}</Text></View> : null}
                </View>
              ) : null}
              {canManage && layout.storeCardActionsAtBottom ? (
                <View style={styles.storeCardActions}>
                  <Pressable accessibilityRole="button" onPress={() => openEdit(store)} style={styles.storeCardAction}>
                    <Pencil color={theme.colors.teal} size={14} />
                    <Text style={styles.storeEditActionText}>{t('adminEditStore')}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => { setPendingArchive(store); setPendingArchiveValue(!store.archivedAt); setIsArchiveDialogOpen(true); }} style={styles.storeCardAction}>
                    {store.archivedAt ? <RotateCcw color={theme.colors.orange} size={14} /> : <Archive color={theme.colors.orange} size={14} />}
                    <Text style={styles.storeArchiveActionText}>{store.archivedAt ? t('adminRestore') : t('adminArchive')}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {pageInfo.page < pageInfo.totalPages ? (
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
      ) : null}

      {!layout.desktopWeb ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('adminAddStore')} onPress={openCreate} style={styles.fab}>
          <Plus color={theme.colors.white} size={24} />
        </Pressable>
      ) : null}

      <ResponsiveDrawerModal
        visible={isFilterDrawerOpen}
        closeLabel={t('adminCloseMenu')}
        onClose={() => setIsFilterDrawerOpen(false)}
        onAfterClose={() => setOpenMobileFilter(null)}
        panelStyle={!layout.isWeb ? { height: Math.min(height * 0.8, 390) } : undefined}
      >
        <View style={styles.drawerContent}>
          <View style={styles.drawerHeading}>
            <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('adminFilterStores')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={() => setIsFilterDrawerOpen(false)} style={styles.userIconAction}>
              <X color={theme.colors.muted} size={18} />
            </Pressable>
          </View>
          <ScrollView style={styles.drawerFormScroll} contentContainerStyle={styles.filterDrawerFields} keyboardShouldPersistTaps="handled">
            <Field
              label={t('adminSearchStoresPlaceholder')}
              placeholder={t('adminSearchStoresPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
              containerStyle={styles.filterDrawerField}
            />
            <StoreFilterDropdown
              label={t('adminStatus')}
              value={statusFilter}
              expanded={openMobileFilter === 'status'}
              onToggle={() => setOpenMobileFilter((current) => current === 'status' ? null : 'status')}
              onSelect={(value) => { setStatusFilter(value as StoreStatusFilter); setOpenMobileFilter(null); }}
              containerStyle={styles.filterDrawerDropdown}
              options={[
                { value: 'active', label: t('adminActive') },
                { value: 'archived', label: t('adminArchived') },
                { value: 'all', label: t('adminAllStores') },
              ]}
            />
            <StoreFilterDropdown
              label={t('adminStoreType')}
              value={typeFilter}
              expanded={openMobileFilter === 'type'}
              optionsPlacement="above"
              onToggle={() => setOpenMobileFilter((current) => current === 'type' ? null : 'type')}
              onSelect={(value) => { setTypeFilter(value as StoreTypeFilter); setOpenMobileFilter(null); }}
              containerStyle={styles.filterDrawerDropdown}
              options={[
                { value: 'all', label: t('adminAllTypes') },
                { value: 'company', label: t('adminCompanyStore') },
                { value: 'franchise', label: t('adminFranchiseStore') },
              ]}
            />
            {openMobileFilter ? (
              <Pressable
                testID="store-filter-dropdown-dismiss"
                accessibilityRole="button"
                accessibilityLabel={t('adminCloseMenu')}
                onPress={() => setOpenMobileFilter(null)}
                style={styles.filterDropdownDismissOverlay}
              />
            ) : null}
          </ScrollView>
          <View style={styles.modalActions}>
            <View style={styles.drawerActionSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !hasDraftFilters }}
                disabled={!hasDraftFilters}
                onPress={clearFilters}
                style={[
                  styles.secondaryButton,
                  styles.drawerActionButton,
                  !hasDraftFilters && styles.filterDrawerDisabledButton,
                ]}
              >
                <Text style={styles.secondaryButtonText}>{t('adminClearFilters')}</Text>
              </Pressable>
            </View>
            <View style={styles.drawerActionSlot}>
              <Pressable onPress={applyFilters} style={[styles.primaryButton, styles.drawerActionButton]}>
                <Text style={styles.primaryButtonText}>{t('adminApplyFilters')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>

      <ResponsiveDrawerModal
        visible={isFormOpen}
        closeLabel={t('adminCloseMenu')}
        onClose={() => setIsFormOpen(false)}
        onAfterClose={() => {
          if (!pendingSuccessMessage) return;
          onToast(pendingSuccessMessage, 'success');
          setPendingSuccessMessage('');
        }}
        overlay={isFormOpen && toastMessage ? <AppToast message={toastMessage} tone={toastTone} onDismiss={dismissToast} /> : null}
      >
        <View style={styles.drawerContent}>
          <View style={styles.drawerHeading}>
            <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t(editingStore ? 'adminEditStore' : 'adminAddStore')}</Text>
          </View>
          <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>{t('adminStoreType')}</Text>
            <View style={styles.typeOptions}>
              <Pressable onPress={() => updateField('storeType', 'company')} style={[styles.secondaryButton, styles.typeOption, styles.storeChoiceOption, form.storeType === 'company' && styles.storeOptionSelected]}>
                <Text style={styles.secondaryButtonText}>{t('adminCompanyStore')}</Text>
              </Pressable>
              <Pressable onPress={() => updateField('storeType', 'franchise')} style={[styles.secondaryButton, styles.typeOption, styles.storeChoiceOption, form.storeType === 'franchise' && styles.storeOptionSelected]}>
                <Text style={styles.secondaryButtonText}>{t('adminFranchiseStore')}</Text>
              </Pressable>
            </View>
            <Field label={t('adminStoreName')} placeholder={t('adminStoreNamePlaceholder')} value={form.name} onChangeText={(value) => updateField('name', value)} error={fieldErrors.name} />
            <Field label={t('adminStoreCode')} placeholder={t('adminStoreCodePlaceholder')} value={form.storeCode} onChangeText={(value) => updateField('storeCode', value.toUpperCase())} autoCapitalize="characters" error={fieldErrors.storeCode} />
            <Field label={t('adminPhone')} placeholder={t('adminPhonePlaceholder')} value={form.phone} onChangeText={(value) => updateField('phone', value.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" phonePrefix="+91" error={fieldErrors.phone} />
            <Field label={t('adminAddress')} placeholder={t('adminAddressPlaceholder')} value={form.address} onChangeText={(value) => updateField('address', value)} />
            <Field label={t('adminDescription')} placeholder={t('adminDescriptionPlaceholder')} value={form.description} onChangeText={(value) => updateField('description', value)} multiline />
            {form.storeType === 'franchise' ? (
              <>
                <Text style={styles.sectionLabel}>{t('adminOwnerDetails')}</Text>
                <Field label={t('adminOwnerName')} placeholder={t('adminOwnerNamePlaceholder')} value={form.ownerName} onChangeText={(value) => updateField('ownerName', value)} />
                <Field label={t('adminOwnerPhone')} placeholder={t('adminOwnerPhonePlaceholder')} value={form.ownerPhone} onChangeText={(value) => updateField('ownerPhone', value.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" phonePrefix="+91" error={fieldErrors.ownerPhone} />
                <Field label={t('adminOwnerEmail')} placeholder={t('adminOwnerEmailPlaceholder')} value={form.ownerEmail} onChangeText={(value) => updateField('ownerEmail', value)} keyboardType="email-address" autoCapitalize="none" error={fieldErrors.ownerEmail} />
              </>
            ) : null}
            {editingStore ? (
              <>
                <Text style={styles.fieldLabel}>{t('adminStatus')}</Text>
                <View style={styles.typeOptions}>
                  <Pressable onPress={() => setFormIsArchived(false)} style={[styles.secondaryButton, styles.typeOption, styles.storeChoiceOption, !formIsArchived && styles.storeOptionSelected]}>
                    <Text style={styles.secondaryButtonText}>{t('adminActive')}</Text>
                  </Pressable>
                  <Pressable onPress={() => setFormIsArchived(true)} style={[styles.secondaryButton, styles.typeOption, styles.storeChoiceOption, formIsArchived && styles.storeOptionSelected]}>
                    <Text style={styles.secondaryButtonText}>{t('adminArchived')}</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </ScrollView>
          <View style={styles.modalActions}>
            <View style={styles.drawerActionSlot}>
              <Pressable onPress={() => setIsFormOpen(false)} style={[styles.secondaryButton, styles.drawerActionButton]}>
                <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
              </Pressable>
            </View>
            <View style={styles.drawerActionSlot}>
              <Pressable disabled={isSaving} onPress={() => void saveStore()} style={[styles.primaryButton, styles.drawerActionButton]}>
                {isSaving ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t(editingStore ? 'adminSaveChanges' : 'adminCreateStore')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>

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

interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'characters';
  multiline?: boolean;
  error?: string;
  phonePrefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

function Field({ label, placeholder, value, onChangeText, keyboardType = 'default', autoCapitalize, multiline, error, phonePrefix, containerStyle }: FieldProps) {
  const input = (
    <TextInput
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      multiline={multiline}
      style={[styles.fieldInput, multiline && styles.multilineField, phonePrefix && styles.phoneFieldInput, !phonePrefix && error && styles.inputError]}
    />
  );

  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {phonePrefix ? (
        <View style={[styles.phoneInputWrap, error && styles.phoneInputWrapError]}>
          <View style={styles.phoneInputCode}>
            <Text style={styles.phoneInputPrefix}>{phonePrefix}</Text>
          </View>
          {input}
        </View>
      ) : input}
      {error ? <Text accessibilityRole="alert" style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

interface StoreFilterDropdownProps<Value extends StoreFilterValue> {
  label: string;
  value: Value;
  expanded: boolean;
  optionsPlacement?: 'above' | 'below';
  options: { value: Value; label: string }[];
  onToggle: () => void;
  onSelect: (value: Value) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

function StoreFilterDropdown<Value extends StoreFilterValue>({ label, value, expanded, optionsPlacement = 'below', options, onToggle, onSelect, containerStyle }: StoreFilterDropdownProps<Value>) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';

  return (
    <View style={[styles.storeFilterDropdown, expanded && styles.storeFilterDropdownOpen, containerStyle]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onToggle} style={[styles.storeFilterDropdownButton, expanded && styles.storeFilterDropdownButtonOpen]}>
        <View style={styles.storeFilterDropdownCopy}>
          <Text style={styles.storeFilterDropdownLabel}>{label}</Text>
          <Text numberOfLines={1} style={styles.storeFilterDropdownValue}>{selectedLabel}</Text>
        </View>
        <ChevronDown color={theme.colors.muted} size={14} />
      </Pressable>
      {expanded ? (
        <View style={[
          styles.storeFilterDropdownOptions,
          optionsPlacement === 'above' && styles.storeFilterDropdownOptionsAbove,
        ]}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable key={option.value} onPress={() => onSelect(option.value)} style={[styles.storeFilterDropdownOption, active && styles.storeFilterDropdownOptionActive]}>
                <Text style={[styles.storeFilterDropdownOptionText, active && styles.storeFilterDropdownOptionTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
