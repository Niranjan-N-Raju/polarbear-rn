import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Check, Filter, Pencil, Plus, Trash2, X } from '../../icons';
import { AppErrorState } from '../../components/AppErrorState';
import { AdminFilterDropdown } from '../../components/AdminFilterDropdown';
import { AdminFormField } from '../../components/AdminFormField';
import { AppToast } from '../../components/AppToast';
import { AppLoader } from '../../components/AppLoader';
import { apiRequest } from '../../api/auth';
import { theme } from '../../config/theme';
import { t, translateRole } from '../../i18n';
import { adminStyles as styles } from '../../styles/adminStyles';
import { getAdminLayout } from '../../utils/adminLayout';
import { ResponsiveDrawerModal } from '../../components/ResponsiveDrawerModal';

interface StoreOption {
  _id: string;
  name: string;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive?: boolean;
  franchises: StoreOption[];
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: 'sub_admin' | 'franchise_admin';
  franchiseIds: string[];
}

type UserFieldErrors = Partial<Record<'name' | 'email' | 'password' | 'franchiseIds', string>>;
type UserStatusFilter = 'all' | 'active' | 'inactive';
type OpenUserFilter = 'store' | 'status' | 'type' | null;
interface UserListFilters {
  search: string;
  franchiseId: string;
  status: UserStatusFilter;
  role: string;
}
interface PageInfo {
  page: number;
  totalPages: number;
  total: number;
}

const blankForm: UserForm = { name: '', email: '', password: '', role: 'sub_admin', franchiseIds: [] };
const defaultUserFilters: UserListFilters = { search: '', franchiseId: '', status: 'all', role: 'all' };

interface AdminUsersScreenProps {
  onToast: (message: string, tone: 'success' | 'error') => void;
}

export function AdminUsersScreen({ onToast }: AdminUsersScreenProps) {
  const { width, height } = useWindowDimensions();
  const layout = getAdminLayout(width);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [filterStore, setFilterStore] = useState('');
  const [filterStatus, setFilterStatus] = useState<UserStatusFilter>('all');
  const [filterRole, setFilterRole] = useState('all');
  const [storeSearchText, setStoreSearchText] = useState('');
  const [openFilter, setOpenFilter] = useState<OpenUserFilter>(null);
  const [searchText, setSearchText] = useState('');
  const [appliedFilters, setAppliedFilters] = useState(defaultUserFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ page: 1, totalPages: 1, total: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [hasLoadedStores, setHasLoadedStores] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<UserForm>(blankForm);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({});
  const [toastMessage, setToastMessage] = useState('');
  const [pendingFormSuccess, setPendingFormSuccess] = useState('');
  const [pendingDeleteSuccess, setPendingDeleteSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const initialLoadComplete = useRef(false);
  const dismissToast = useCallback(() => setToastMessage(''), []);
  const showErrorToast = useCallback((message: string) => setToastMessage(message), []);

  const load = useCallback(async (page: number, filters: UserListFilters, append = false): Promise<boolean> => {
    if (append) setIsLoadingMore(true);
    else setIsRefreshing(true);
    setLoadError('');
    try {
      const query = new URLSearchParams({
        excludeEmployees: 'true',
        includeArchived: 'true',
        page: String(page),
        limit: '10',
        status: filters.status,
      });
      if (filters.search.trim()) query.set('search', filters.search.trim());
      if (filters.franchiseId) query.set('franchiseId', filters.franchiseId);
      if (filters.role !== 'all') query.set('role', filters.role);
      const usersResponse = await apiRequest(`/users?${query.toString()}`);
      const usersData = await usersResponse.json() as {
        users?: AdminUser[];
        pagination?: PageInfo;
        message?: string;
      };
      if (!usersResponse.ok) throw new Error(usersData.message ?? t('adminLoadFailed'));
      const loadedUsers = usersData.users ?? [];
      setUsers((current) => append ? [...current, ...loadedUsers] : loadedUsers);
      setPageInfo(usersData.pagination ?? { page, totalPages: page, total: loadedUsers.length });
      initialLoadComplete.current = true;
      setStores((current) => {
        const options = new Map(current.map((store) => [store._id, store]));
        loadedUsers.forEach((user) => user.franchises.forEach((store) => options.set(store._id, store)));
        return [...options.values()];
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('adminLoadFailed');
      if (append || initialLoadComplete.current) onToast(message, 'error');
      else setLoadError(message);
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
    void load(1, defaultUserFilters);
  }, [load]);

  const visibleUsers = users;
  const userRoleOptions = ['admin', 'sub_admin', 'franchise_admin']
    .map((role) => ({ value: role, label: translateRole(role) }));
  const hasActiveFilters = Boolean(
    appliedFilters.search
    || appliedFilters.franchiseId
    || appliedFilters.status !== 'all'
    || appliedFilters.role !== 'all',
  );
  const hasDraftFilters = Boolean(
    searchText.trim()
    || filterStore
    || filterStatus !== 'all'
    || filterRole !== 'all',
  );

  function openFilters(): void {
    setSearchText(appliedFilters.search);
    setFilterStore(appliedFilters.franchiseId);
    setStoreSearchText(stores.find((store) => store._id === appliedFilters.franchiseId)?.name ?? '');
    setFilterStatus(appliedFilters.status);
    setFilterRole(appliedFilters.role);
    setOpenFilter(null);
    setIsFilterDrawerOpen(true);
    void loadStores();
  }

  async function applyFilters(): Promise<void> {
    const filters: UserListFilters = {
      search: searchText.trim(),
      franchiseId: filterStore,
      status: filterStatus,
      role: filterRole,
    };
    setOpenFilter(null);
    setIsFilterDrawerOpen(false);
    if (!await load(1, filters)) return;
    setAppliedFilters(filters);
  }

  async function clearFilters(): Promise<void> {
    setOpenFilter(null);
    setIsFilterDrawerOpen(false);
    if (!await load(1, defaultUserFilters)) return;
    setSearchText('');
    setStoreSearchText('');
    setFilterStore('');
    setFilterStatus('all');
    setFilterRole('all');
    setAppliedFilters(defaultUserFilters);
  }

  function loadMore(): void {
    void load(pageInfo.page + 1, appliedFilters, true);
  }

  const loadStores = useCallback(async () => {
    if (hasLoadedStores || isLoadingStores) return;
    setIsLoadingStores(true);
    try {
      const response = await apiRequest('/stores?limit=100');
      const data = await response.json() as { franchises?: StoreOption[]; message?: string };
      if (!response.ok) throw new Error(data.message ?? t('adminLoadFailed'));
      setStores(data.franchises ?? []);
      setHasLoadedStores(true);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : t('adminLoadFailed'));
    } finally {
      setIsLoadingStores(false);
    }
  }, [hasLoadedStores, isLoadingStores, showErrorToast]);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  function openCreate(): void {
    setEditing(null);
    setForm(blankForm);
    setFieldErrors({});
    setToastMessage('');
    setIsFormOpen(true);
    void loadStores();
  }

  function openEdit(user: AdminUser): void {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role === 'franchise_admin' ? 'franchise_admin' : 'sub_admin',
      franchiseIds: user.franchises.map((store) => store._id),
    });
    setFieldErrors({});
    setToastMessage('');
    setIsFormOpen(true);
    void loadStores();
  }

  function updateField<Key extends keyof UserForm>(key: Key, value: UserForm[Key]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      if (key === 'name') delete next.name;
      else if (key === 'email') delete next.email;
      else if (key === 'password') delete next.password;
      else if (key === 'franchiseIds') delete next.franchiseIds;
      return next;
    });
  }

  function toggleStore(id: string): void {
    updateField('franchiseIds', form.franchiseIds.includes(id)
      ? form.franchiseIds.filter((storeId) => storeId !== id)
      : [...form.franchiseIds, id]);
  }

  function validate(): UserFieldErrors {
    const errors: UserFieldErrors = {};
    if (!form.name.trim()) errors.name = t('adminUserNameRequired');
    if (!form.email.trim()) errors.email = t('adminUserEmailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t('adminUserEmailInvalid');
    if (!editing) {
      if (!form.password) errors.password = t('adminUserPasswordRequired');
      else if (form.password.length < 12) errors.password = t('adminPasswordLength');
      else if (!/[A-Z]/.test(form.password)) errors.password = t('adminPasswordUppercase');
      else if (!/[a-z]/.test(form.password)) errors.password = t('adminPasswordLowercase');
      else if (!/\d/.test(form.password)) errors.password = t('adminPasswordNumber');
      else if (!/[^A-Za-z0-9]/.test(form.password)) errors.password = t('adminPasswordSpecial');
    }
    if (form.role === 'franchise_admin' && form.franchiseIds.length === 0) errors.franchiseIds = t('adminUserStoreRequired');
    return errors;
  }

  async function save(): Promise<void> {
    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setIsSaving(true);
    setFieldErrors({});
    setToastMessage('');
    try {
      const response = await apiRequest(
        editing ? `/users/${encodeURIComponent(editing._id)}` : '/users',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editing
            ? { name: form.name.trim(), role: form.role, franchiseIds: form.role === 'sub_admin' ? [] : form.franchiseIds }
            : { name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role, franchiseIds: form.role === 'sub_admin' ? [] : form.franchiseIds }),
        },
      );
      const data = await response.json() as { message?: string };
      if (!response.ok) {
        showErrorToast(data.message ?? t('adminSaveFailed'));
        return;
      }
      setPendingFormSuccess(t('adminUserSaved'));
      setIsFormOpen(false);
      setEditing(null);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : t('adminSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteUser(): Promise<void> {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiRequest(`/users/${encodeURIComponent(pendingDelete._id)}`, { method: 'DELETE' });
      const data = await response.json() as { message?: string };
      if (!response.ok) {
        showErrorToast(data.message ?? t('adminSaveFailed'));
        return;
      }
      setPendingDeleteSuccess(t('adminUserDeleted'));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : t('adminNetworkError'));
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) return <AppLoader variant="screen" />;
  if (loadError) return <AppErrorState message={loadError} onRetry={() => void load(1, appliedFilters)} />;

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, layout.desktopWeb && styles.screenHeaderInline, layout.compactWeb && styles.screenHeaderStack]}>
        <View style={layout.isWeb ? styles.screenHeaderCopy : styles.screenHeaderCopyNative}>
          {layout.desktopWeb ? <Text style={[styles.screenEyebrow, styles.screenEyebrowTeal]}>Access management</Text> : null}
          <View style={styles.screenTitleRow}>
            <Text style={[styles.screenTitle, styles.screenTitleInline]}>{t('adminUsers')}</Text>
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
          <Text style={styles.screenDescription}>{t('adminManageUsers')}</Text>
        </View>
        <View style={styles.screenHeaderActions}>
          {layout.desktopWeb ? (
            <Pressable accessibilityRole="button" onPress={openCreate} style={[styles.primaryButton, styles.screenHeaderAction]}>
              <Text style={styles.primaryButtonText}>{t('adminAddUser')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isRefreshing ? <AppLoader variant="inline" /> : null}
      {visibleUsers.length === 0 ? <Text style={styles.stateMessage}>{hasActiveFilters ? t('adminNoMatchingUsers') : t('adminNoUsers')}</Text> : null}
      {visibleUsers.length > 0 ? (layout.usersTable ? (
        <View style={styles.usersTable}>
          <View style={[styles.usersTableRow, styles.usersTableHeader]}>
            <Text style={[styles.usersTableCell, styles.usersTableHeaderText, styles.usersTableName]}>Name</Text>
            <Text style={[styles.usersTableCell, styles.usersTableHeaderText, styles.usersTableEmail]}>Email</Text>
            <Text style={[styles.usersTableCell, styles.usersTableHeaderText, styles.usersTableStores]}>Stores</Text>
            <View style={styles.usersTableActions} />
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {visibleUsers.map((user) => (
              <View key={user._id} style={styles.usersTableRow}>
                <View style={[styles.usersTableCell, styles.usersTableName]}>
                  <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text></View>
                  <View style={styles.userNameRoleGroup}>
                    <Text numberOfLines={1} style={styles.userTableNameText}>{user.name}</Text>
                    <View style={styles.userRoleTag}>
                      <Text style={styles.userRoleTagText}>{translateRole(user.role)}</Text>
                    </View>
                  </View>
                </View>
                <Text numberOfLines={1} style={[styles.usersTableCell, styles.usersTableEmail]}>{user.email}</Text>
                <View style={[styles.usersTableCell, styles.usersTableStores]}>
                  {user.franchises.length === 0
                    ? <Text style={styles.rowSubtext}>{t('adminNoStore')}</Text>
                    : user.franchises.map((store) => <Text key={store._id} style={styles.userTableStore}>{store.name}</Text>)}
                </View>
                <View style={styles.usersTableActions}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t('adminEditUser')} ${user.name}`} onPress={() => openEdit(user)} style={styles.userIconAction}>
                    <Pencil color={theme.colors.teal} size={16} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t('adminDelete')} ${user.name}`} onPress={() => { setPendingDelete(user); setIsDeleteDialogOpen(true); }} style={styles.userIconAction}>
                    <Trash2 color={theme.colors.error} size={16} />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
      <ScrollView style={[styles.list, !layout.desktopWeb && { marginBottom: 72 }]} contentContainerStyle={[styles.listContent, !layout.desktopWeb && { paddingBottom: 88 }]}>
        {visibleUsers.map((user) => (
          <View key={user._id} style={styles.row}>
            <View style={styles.rowHeader}>
              <View style={[styles.userNameRoleGroup, styles.userCardTitle]}>
                <Text numberOfLines={1} style={[styles.rowTitle, styles.userTableNameText]}>{user.name}</Text>
                <View style={styles.userRoleTag}>
                  <Text style={styles.userRoleTagText}>{translateRole(user.role)}</Text>
                </View>
              </View>
              <View style={styles.userCardActions}>
                <Pressable accessibilityRole="button" accessibilityLabel={`${t('adminEditUser')} ${user.name}`} onPress={() => openEdit(user)} style={styles.userIconAction}>
                  <Pencil color={theme.colors.teal} size={16} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`${t('adminDelete')} ${user.name}`} onPress={() => { setPendingDelete(user); setIsDeleteDialogOpen(true); }} style={styles.userIconAction}>
                  <Trash2 color={theme.colors.error} size={16} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.rowSubtext}>{user.email}</Text>
            <View style={styles.storePills}>
              {user.franchises.length === 0 ? <Text style={styles.rowSubtext}>{t('adminNoStore')}</Text> : user.franchises.map((store) => (
                <View key={store._id} style={styles.storePill}><Text style={styles.storePillText}>{store.name}</Text></View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      )) : null}

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
        <Pressable accessibilityRole="button" accessibilityLabel={t('adminAddUser')} onPress={openCreate} style={styles.fab}>
          <Plus color={theme.colors.white} size={24} />
        </Pressable>
      ) : null}

      <ResponsiveDrawerModal
        visible={isFilterDrawerOpen}
        closeLabel={t('adminCloseMenu')}
        onClose={() => setIsFilterDrawerOpen(false)}
        onAfterClose={() => setOpenFilter(null)}
        panelStyle={!layout.isWeb ? { height: Math.min(height * 0.8, 470) } : undefined}
      >
        <View style={styles.drawerContent}>
          <View style={styles.drawerHeading}>
            <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t('adminFilterUsers')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={() => setIsFilterDrawerOpen(false)} style={styles.userIconAction}>
              <X color={theme.colors.muted} size={18} />
            </Pressable>
          </View>
          <ScrollView style={styles.drawerFormScroll} contentContainerStyle={styles.filterDrawerFields} keyboardShouldPersistTaps="handled">
            <AdminFormField
              label={t('adminSearchUsers')}
              placeholder={t('adminSearchUsers')}
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
              containerStyle={styles.filterDrawerField}
            />
            <StoreAutocomplete
              stores={stores}
              value={storeSearchText}
              expanded={openFilter === 'store'}
              containerStyle={styles.filterDrawerDropdown}
              onFocus={() => setOpenFilter('store')}
              onChangeText={(value) => {
                setStoreSearchText(value);
                setFilterStore('');
                setOpenFilter('store');
              }}
              onSelect={(store) => {
                setStoreSearchText(store.name);
                setFilterStore(store._id);
                setOpenFilter(null);
              }}
            />
            <AdminFilterDropdown
              label={t('adminStatus')}
              value={filterStatus}
              expanded={openFilter === 'status'}
              containerStyle={[styles.userFilterDropdown, styles.filterDrawerDropdown]}
              onToggle={() => setOpenFilter((current) => current === 'status' ? null : 'status')}
              onSelect={(value) => {
                setFilterStatus(value);
                setOpenFilter(null);
              }}
              options={[
                { value: 'all', label: t('adminAllUsers') },
                { value: 'active', label: t('adminActive') },
                { value: 'inactive', label: t('adminInactive') },
              ]}
            />
            <AdminFilterDropdown
              label={t('adminUserTypeFilter')}
              value={filterRole}
              expanded={openFilter === 'type'}
              containerStyle={[styles.userFilterDropdown, styles.filterDrawerDropdown]}
              optionsPlacement="above"
              onToggle={() => setOpenFilter((current) => current === 'type' ? null : 'type')}
              onSelect={(value) => {
                setFilterRole(value);
                setOpenFilter(null);
              }}
              options={[
                { value: 'all', label: t('adminAllUserTypes') },
                ...userRoleOptions,
              ]}
            />
            {openFilter ? (
              <Pressable
                testID="user-filter-dropdown-dismiss"
                accessibilityRole="button"
                accessibilityLabel={t('adminCloseMenu')}
                onPress={() => setOpenFilter(null)}
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
          if (!pendingFormSuccess) return;
          onToast(pendingFormSuccess, 'success');
          setPendingFormSuccess('');
          void load(1, appliedFilters);
        }}
        overlay={toastMessage ? <AppToast message={toastMessage} onDismiss={dismissToast} /> : null}
      >
        <View style={styles.drawerContent}>
          <View style={styles.drawerHeading}>
            <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>{t(editing ? 'adminEditUser' : 'adminAddUser')}</Text>
          </View>
          <ScrollView style={styles.drawerFormScroll} keyboardShouldPersistTaps="handled">
              <AdminFormField label={t('adminFullName')} placeholder={t('adminFullNamePlaceholder')} value={form.name} onChangeText={(name) => updateField('name', name)} error={fieldErrors.name} autoCorrect={false} />
              <AdminFormField label={t('adminEmail')} placeholder={t('adminUserEmailPlaceholder')} value={form.email} editable={!editing} keyboardType="email-address" autoCapitalize="none" onChangeText={(email) => updateField('email', email)} error={fieldErrors.email} autoCorrect={false} />
              {!editing ? <AdminFormField label={t('adminPassword')} placeholder={t('adminUserPasswordPlaceholder')} value={form.password} secureTextEntry onChangeText={(password) => updateField('password', password)} error={fieldErrors.password} autoCorrect={false} /> : null}
              <Text style={styles.fieldLabel}>{t('adminRole')}</Text>
              <View style={styles.typeOptions}>
                {(['sub_admin', 'franchise_admin'] as const).map((role) => (
                  <Pressable key={role} onPress={() => {
                    setForm((current) => ({ ...current, role, franchiseIds: role === 'sub_admin' ? [] : current.franchiseIds }));
                    if (role === 'sub_admin') setFieldErrors((current) => ({ ...current, franchiseIds: undefined }));
                  }} style={[styles.secondaryButton, styles.typeOption, form.role === role && styles.typeOptionSelected]}>
                    <Text style={styles.secondaryButtonText}>{t(role === 'sub_admin' ? 'adminSubAdmin' : 'adminFranchiseAdmin')}</Text>
                  </Pressable>
                ))}
              </View>
              {form.role === 'franchise_admin' ? (
                <View style={[styles.field, fieldErrors.franchiseIds && styles.userAssignmentError]}>
                  <Text style={styles.fieldLabel}>{t('adminAssignStores')}</Text>
                  {stores.map((store) => {
                    const selected = form.franchiseIds.includes(store._id);
                    return (
                      <Pressable
                        key={store._id}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        onPress={() => toggleStore(store._id)}
                        style={[styles.checkboxRow, selected && styles.checkboxRowSelected]}
                      >
                        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                          {selected ? <Check color={theme.colors.white} size={14} strokeWidth={3} /> : null}
                        </View>
                        <Text style={styles.checkboxText}>{store.name}</Text>
                      </Pressable>
                    );
                  })}
                  {fieldErrors.franchiseIds ? <Text accessibilityRole="alert" style={styles.fieldError}>{fieldErrors.franchiseIds}</Text> : null}
                </View>
              ) : null}
          </ScrollView>
          <View style={styles.modalActions}>
            <View style={styles.drawerActionSlot}>
              <Pressable onPress={() => setIsFormOpen(false)} style={[styles.secondaryButton, styles.drawerActionButton]}><Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text></Pressable>
            </View>
            <View style={styles.drawerActionSlot}>
              <Pressable disabled={isSaving} onPress={() => void save()} style={[styles.primaryButton, styles.drawerActionButton]}>
                {isSaving ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t('adminSave')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>

      <ResponsiveDrawerModal
        visible={isDeleteDialogOpen && pendingDelete !== null}
        presentation="dialog"
        closeLabel={t('adminCloseMenu')}
        onClose={() => setIsDeleteDialogOpen(false)}
        onAfterClose={() => {
          setPendingDelete(null);
          if (!pendingDeleteSuccess) return;
          onToast(pendingDeleteSuccess, 'success');
          setPendingDeleteSuccess('');
          void load(1, appliedFilters);
        }}
        overlay={toastMessage ? <AppToast message={toastMessage} onDismiss={dismissToast} /> : null}
      >
        <View style={styles.confirmDialogContent}>
          <View style={styles.confirmDialogHeader}>
            <Text style={[styles.modalTitle, styles.confirmDialogTitle]}>{t('adminDeleteUser')}</Text>
          </View>
          <View style={styles.confirmDialogBody}>
            <Text style={styles.screenDescription}>{t('adminConfirmDeleteUser', { name: pendingDelete?.name ?? '' })}</Text>
          </View>
          <View style={styles.confirmDialogActions}>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable onPress={() => setIsDeleteDialogOpen(false)} style={[styles.secondaryButton, styles.confirmDialogActionButton]}><Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text></Pressable>
            </View>
            <View style={styles.confirmDialogActionSlot}>
              <Pressable disabled={isDeleting} onPress={() => void deleteUser()} style={[styles.dangerButton, styles.confirmDialogActionButton]}>
                {isDeleting ? <AppLoader variant="inline" color={theme.colors.white} /> : <Text style={styles.dangerButtonText}>{t('adminDelete')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ResponsiveDrawerModal>
    </View>
  );
}

interface StoreAutocompleteProps {
  stores: StoreOption[];
  value: string;
  expanded: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  onFocus: () => void;
  onChangeText: (value: string) => void;
  onSelect: (store: StoreOption) => void;
}

function StoreAutocomplete({ stores, value, expanded, containerStyle, onFocus, onChangeText, onSelect }: StoreAutocompleteProps) {
  const normalizedSearch = value.trim().toLocaleLowerCase();
  const matches = stores
    .filter((store) => store.name.toLocaleLowerCase().includes(normalizedSearch))
    .slice(0, 8);

  return (
    <View style={[styles.storeFilterDropdown, styles.userStoreAutocomplete, expanded && styles.storeFilterDropdownOpen, containerStyle]}>
      <TextInput
        value={value}
        placeholder={t('adminSearchStores')}
        onFocus={onFocus}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.fieldInput, styles.storeSearch, styles.userFilterInput]}
      />
      {expanded && matches.length > 0 ? (
        <View style={[styles.storeFilterDropdownOptions, styles.userStoreAutocompleteOptions]}>
          {matches.map((store) => (
            <Pressable
              key={store._id}
              accessibilityRole="button"
              onPress={() => onSelect(store)}
              style={styles.storeFilterDropdownOption}
            >
              <Text style={styles.storeFilterDropdownOptionText}>{store.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
